using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "DevelopTeam,Manager,Moderator")]
public class SendEmailController(ILocalMailService service, IHelpService helpService, ILocalFileService localFileService, ILogger<SendEmailController> logger) : ControllerBase
{
    private readonly ILocalMailService _service = service;
    private readonly IHelpService _helpService = helpService;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly ILogger<SendEmailController> _logger = logger;

    #region POST
    [HttpPost]
    public async Task<IActionResult> Send(SendEmailFormModel model)
    {
        try
        {
            if (!ModelState.IsValid)
                return Ok(_helpService.Invalid());

            //var receivers = model.Group switch
            //{
            //    "Studenter" => "Students",
            //    "Personal" => "Employee",
            //    "Politiker" => "Politicians",
            //    _ => null
            //};

            HashSet<string> receivers = [];
            if (!string.IsNullOrEmpty(model.Group) && !string.Equals(model.Group, "Ingen", StringComparison.OrdinalIgnoreCase))
            {
                var moderators = await _localFileService.GetFromEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];
                var emails = string.Equals(model.Group, "Alla", StringComparison.OrdinalIgnoreCase)
                    ? [.. moderators.Select(s => s.Email!)]
                    : moderators.Where(x => x.Permissions!.Groups.Contains(model.Group, StringComparer.OrdinalIgnoreCase)).Select(s => s.Email)!.ToList();

                if (emails.Count == 0)
                    return Ok(_helpService.Warning("E-postmottagare hittades inte."));

                foreach (var email in emails)
                {
                    if (email != null && _helpService.CheckEmail(email!.Trim()))
                        receivers.Add(email!.Trim());
                }
            }

            if (model.CopyTo?.Count > 0)
            {
                foreach (var email in model.CopyTo)
                {
                    if (email != null && _helpService.CheckEmail(email!.Trim()))
                        receivers.Add(email!.Trim());
                }
            }

            if(receivers.Count == 0)
                return Ok(_helpService.Warning("E-postmottagare hittades inte."));

            await _service.SendMail([.. receivers], model.Subject!, model.Message!);

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError("Error occured with attempt sen email to users. Error: {0}", ex.Message);
            return BadRequest(await _helpService.Error(ex));
        }
    }
    #endregion
}
