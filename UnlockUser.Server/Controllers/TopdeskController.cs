using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Text;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TopdeskController(
    DashboardService dashboard,
    ICredentialsService credentials,
    ILocalFileService localFiles,
    IHelpService help,
    IMemoryCache cache,
    ILogger<TopdeskController> logger) : ControllerBase
{
    private readonly DashboardService _dashboard = dashboard;
    private readonly ICredentialsService _credentials = credentials;
    private readonly ILocalFileService _localFiles = localFiles;
    private readonly IHelpService _help = help;
    private readonly ILogger<TopdeskController> _logger = logger;


    #region POST
    [HttpPost("case/kc")]
    [Authorize(Roles = "Developteam,ITGroup,KCGroup")]
    public async Task<IActionResult> PostKCCase(CaseFormModel model)
    {
        try
        {
            if (model.ApprovedEmployees == null || model.ApprovedEmployees?.Count == 0)
                return Ok(_help.Warning("Inga användare kunde hittas för godkännande."));

            var moderators = await _localFiles.GetEncryptedFile<List<User>>("catalogs/moderators");
            var moderator = moderators?.FirstOrDefault(x => x.Username != null && x.Username.Equals(model.Username?.ToString(), StringComparison.OrdinalIgnoreCase));
            if (moderator == null)
                return Ok(_help.NotFound($"Användaren {model.Username}"));

            // Case caller data (current user)
            var claims = _credentials.GetClaims(["email", "displayName"]);
            claims.TryGetValue("email", out string? email);
            claims.TryGetValue("displayName", out string? name);


            var date = DateTime.Now;
            StringBuilder _case = new();
            _case.Append("<br/><b>Beskrivning:</b><br/>");
            _case.Append("Vänligen ge följande användare godkännandebehörighet i UnlockUser:<br/><br/>");
            _case.Append("<b>UnlockUser användare:</b></br>");
            _case.Append($"<b>&emsp;- Namn:</b> {moderator.DisplayName}<br/>");
            _case.Append($"<b>&emsp;- Användarnamn:</b> {moderator.Username}<br/>");
            _case.Append($"<b>&emsp;- E-postadress:</b> {moderator.Email}<br/>");
            _case.Append($"<b>&emsp;- Office:</b> {moderator.Office}<br/>");
            _case.Append($"<b>&emsp;- Department:</b> {moderator.Department}<br/>");
            _case.Append("<br/><br/>");
            _case.Append("Behörigheten ska ge användaren möjlighet att godkänna åtkomst för namngivna användare att ändra/låsa upp lösenord för utvalda anställda i UnlockUser.");
            _case.Append("<br/><br/>");
            _case.Append("<b>Utvalda anställda:</b><br/>");
            _case.Append("<ol>");

            int index = 1;

            var users = await _dashboard.GetStoredUsersGroup("personal");
            users ??= [];
            var usernames = model.ApprovedEmployees?.Select(s => s.Username).ToList();
            foreach (var un in usernames!)
            {
                var user = users.FirstOrDefault(x => x.Username == un);
                if (user == null)
                    continue;

                _case.Append("<li>");
                _case.Append($"<b>Anställd: {(index < 10 ? "0" : "")}{index}</b><br/>");
                _case.Append($"<b>&emsp;- Namn:</b> {user.DisplayName}<br/>");
                _case.Append($"<b>&emsp;- Användarnamn:</b> {user.Username}<br/>");
                _case.Append($"<b>&emsp;- E-postadress:</b> {user.Email}<br>");
                _case.Append("</li>");
                index++;
            }
            _case.Append("</ol>");
            if (model.Text != null)
                _case.Append($"<br/><br/>{model.Text}");
            _case.Append("<br/><br/>");
            _case.Append("<b>Ärendet har registrerats av Kontaktcenter.</b>");

            string description = "UnlockUser: Behörighet för lösenordsändring.";
            if (model.Title != null)
                description += $" {model.Title}";

            IncidentCase incident = new()
            {
                Description = description,
                Caller = new Caller
                {
                    Email = email ?? null,
                    DynamicName = name ?? null,
                },
                TargetDate = date.AddHours(7).ToString("O")[..23],
                Request = _case.ToString()
            };

            var res = await TopdeskService.SendData(incident, "incidents");

            return Ok();

        }
        catch (Exception ex)
        {

            _logger.LogInformation("Something went wrong. Error: => {0}. Function: {1}", ex.Message, nameof(PostKCCase));
            return BadRequest(await _help.Error(ex));
        }
    }


    [HttpPost("case/moderator")]
    [Authorize]
    public async Task<IActionResult> PostModeratorCase(IncidentCase model)
    {

        return Ok();
    }
    #endregion
}
