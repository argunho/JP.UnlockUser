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
    TopdeskService topdesk,
    ICredentialsService credentials,
    ILocalFileService localFile,
    IHelpService help,
    IMemoryCache cache,
    ILogger<TopdeskController> logger) : ControllerBase
{
    private readonly DashboardService _dashboard = dashboard;
    private readonly TopdeskService _topdesk = topdesk;
    private readonly ICredentialsService _credentials = credentials;
    private readonly ILocalFileService _localFile = localFile;
    private readonly IHelpService _help = help;
    private readonly ILogger<TopdeskController> _logger = logger;

    #region GET
    // Get cases
    [HttpGet("cases")]
    [Authorize(Roles = "DevelopTeam,ITGroup,KCGroup")]
    public async Task<IActionResult> GetCases()
    {
        try
        {
            Dictionary<string, CaseFormModel> cases =
                await _localFile.GetEncryptedFile<Dictionary<string, CaseFormModel>>("catalogs/cases") ?? [];
            if (cases == null || cases?.Count == 0)
                return Ok();

            List<ViewModel> list = [.. cases?.Select(s => new ViewModel {
                Id = s.Key, // 2026-10-01
                Primary = $"Ärende nummer: {s.Key}",
                Secondary = s.Value.Date.ToString("g"),
                Hidden = $"<h3>{s.Value.Title}</h3><br/>{s.Value.Text}",
                BoolValue = s.Value.ApprovedEmployees?.Count > 0
            })!];

            if(_credentials.GetClaim("openAccess") != null)
                return Ok(list);

            //return Ok( new
            //{
            //    list = list.Where(x => x.BoolValue == true).ToList(),
            //    removable = _credentials.GetClaim("openAccess") != null
            //});
            return Ok(list);
        }
        catch (Exception ex)
        {
            return BadRequest(await Error(ex, nameof(GetCases)));
        }
    }
    #endregion

    #region POST
    [HttpPost("case/kc-group")]
    [Authorize(Roles = "DevelopTeam,ITGroup,KCGroup")]
    public async Task<IActionResult> PostKCCase(CaseFormModel model)
    {
        try
        {
            if (model.ApprovedEmployees == null || model.ApprovedEmployees?.Count == 0)
                return Ok(_help.Warning("Inga användare kunde hittas för godkännande."));

            var moderators = await _localFile.GetEncryptedFile<List<User>>("catalogs/moderators");
            var moderator = moderators?.FirstOrDefault(x => x.Username != null && x.Username.Equals(model.Username?.ToString(), StringComparison.OrdinalIgnoreCase));
            if (moderator == null)
                return Ok(_help.NotFound($"Användaren {model.Username}"));

            // Case caller data (current user)
            var claims = _credentials.GetClaims(["email", "displayName"]);
            claims!.TryGetValue("email", out string? email);
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
            _case.Append("<ul>");

            int index = 1;

            var users = await _dashboard.GetStoredUsersGroup("personal");
            users ??= [];
            var usernames = model.ApprovedEmployees?.Select(s => s.Username).ToList();
            foreach (var un in usernames!)
            {
                var user = users.FirstOrDefault(x => x.Username == un);
                if (user == null)
                    continue;

                _case.Append("<li class=\"case-li\">");
                _case.Append($"<b>Anställd: {(index < 10 ? "0" : "")}{index}</b><br/>");
                _case.Append($"<b>&emsp;- Namn:</b> {user.DisplayName}<br/>");
                _case.Append($"<b>&emsp;- Användarnamn:</b> {user.Username}<br/>");
                _case.Append($"<b>&emsp;- E-postadress:</b> {user.Email}<br/>");
                _case.Append($"<b>&emsp;- Office:</b> {user.Office}<br/><br/>");
                _case.Append("</li>");
                index++;
            }
            _case.Append("</ul>");
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

            var res = await _topdesk.SendData(incident, "incidents");
            if (res is not null)
            {
                model.Title = incident.Description;
                model.Text = _case.ToString();
                _ = Task.Run(async () => await SaveCase(res, model));
            }

            _logger.LogInformation("KC-case. Topdesk-ärende inskickat av {user}. Date: {date}", name, model.Date);

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await Error(ex, nameof(PostKCCase)));
        }
    }

    [HttpPost("case")]
    public async Task<IActionResult> PostModeratorCase(CaseFormModel model)
    {
        try
        {
            if (model.Text == null)
                return Ok(_help.Warning("Text fält är obligatoriskt att fylla i."));

            // Case caller data (current user)
            var claims = _credentials.GetClaims(["email", "displayName", "office"]);
            claims!.TryGetValue("email", out string? email);
            claims.TryGetValue("displayName", out string? name);
            claims.TryGetValue("office", out string? office);

            var date = DateTime.Now;
            StringBuilder _case = new();
            _case.Append("<br/><br/><b>Ärende från UnlockUser.</b>");
            _case.Append("<br/><br/><b>Beskrivning:</b><br/>");

            _case.Append($"<br/>{model.Text}");
            _case.Append($"<br/><br/><b>Ärendet har registrerats av {name}. </b>");

            string description = $"UnlockUser: {model.Title ?? "Ärende"}";

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

            var res = await _topdesk.SendData(incident, "incidents");
            if (res is not null)
            {
                model.Title = incident.Description;
                model.Text = _case.ToString();
                _ = Task.Run(async () => await SaveCase(res, model));
            }

            _logger.LogInformation("User-case. Topdesk-ärende inskickat av {user}. Date: {date}", email, model.Date);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await Error(ex, nameof(PostModeratorCase)));
        }
    }

    [Authorize(Roles = "DevelopTeam,ITGroup")] // 2026-10-01
    [HttpPost("approve/case/permissions")] // 2026-10-01
    public async Task<IActionResult> PostApproveCase(CaseModel model)
    {
        try
        {
            string? number = model.Number;
            if (string.IsNullOrEmpty(number))
                return Ok(_help.Warning("Topdesk-ärendenummer saknas."));
            //else if(model.Close && model.Message == null)
            //    return Ok(_help.Warning("Meddelande saknas."));

            Dictionary<string, CaseFormModel> cases =
                await _localFile.GetEncryptedFile<Dictionary<string, CaseFormModel>>("catalogs/cases") ?? [];
            if (cases == null || cases?.Count == 0 || !cases!.TryGetValue(number, out var caseToApprove))
                return Ok(_help.NotFound("Ärende"));

            await _dashboard.UpdateApprovedEmployees(caseToApprove.Username!, caseToApprove.ApprovedEmployees);

            if (model.Close)
            {
                _ = Task.Run(async () =>
                {
                    var incident = new
                {
                    ProcessingStatus = new { 
                        Id = "da371597-382a-4e29-979e-26b7f75e41dd" 
                    }
                };

                //var email = _credentials.GetClaim("email");
                //var userData = await _topdesk.GetData<List<Dictionary<string, object>>>($"persons/?email={email}");


                await _topdesk.SendData(incident, $"incidents/number/{number}", HttpMethod.Put);
                cases.Remove(number);
                await _localFile.EncrypteToFile(cases, "catalogs/cases");
            });
        }

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await Error(ex, nameof(PostApproveCase)));
        }
    }
    #endregion

    #region DELETE
    [HttpDelete("case/{number}")]
    [Authorize(Roles = "DevelopTeam,ITGroup")]
    public async Task<IActionResult> DeleteCase(string number)
    {
        try
        {
            Dictionary<string, CaseFormModel> cases =
                await _localFile.GetEncryptedFile<Dictionary<string, CaseFormModel>>("catalogs/cases") ?? [];
            if (cases == null || cases?.Count == 0)
                return Ok(_help.NotFound("Ärende"));

            if (cases.ContainsKey(number))
            {
                cases.Remove(number);
            }
            else
                return Ok(_help.NotFound("Ärende"));

            await _localFile.EncrypteToFile(cases, "catalogs/cases");

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await Error(ex, nameof(DeleteCase)));
        }
    }
    #endregion

    #region Helpers
    private async Task SaveCase(Dictionary<string, object> res, CaseFormModel model)
    {
        try
        {
            string? number = null;
            if (res.TryGetValue("number", out var num) && num != null)
                number = num.ToString();

            if (string.IsNullOrEmpty(number))
                return;

            var cases = await _localFile.GetEncryptedFile<Dictionary<string, CaseFormModel>>("catalogs/cases") ?? [];
            cases.Add(number, model);
            await _localFile.EncrypteToFile(cases, "catalogs/cases");
        }
        catch (Exception ex)
        {
            await Error(ex, nameof(SaveCase));
        }
    }

    private async Task<object> Error(Exception ex, string name)
    {
        _logger.LogInformation("Something went wrong. Error: => {0}. Function: {1}", ex.Message, name);
        return await _help.Error(ex);
    }
    #endregion
}
