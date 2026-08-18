using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

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

            var moderators = await _localFileService.GetListFromEncryptedFile<UserViewModel>("catalogs/moderators") ?? [];
            var emails = string.Equals(model.Group, "Alla", StringComparison.OrdinalIgnoreCase) 
                ? [.. moderators.Select(s => s.Email!)]
                : moderators.Where(x => x.Permissions!.Groups.Contains(model.Group, StringComparer.OrdinalIgnoreCase)).Select(s => s.Email)!.ToList();    
            
            if (emails.Count == 0)
                return Ok(_helpService.Warning("E-postmottagare hittades inte"));

            HashSet<string> receivers = [];

            foreach(var email in emails)
            {
                if (email != null && _helpService.CheckEmail(email!.Trim()))
                    receivers.Add(email!.Trim());
            }
            
            if(model.CopyTo != null)
            {
                foreach(var email in model.CopyTo!.Split(","))
                {
                    if (email != null && _helpService.CheckEmail(email!.Trim()))
                        receivers.Add(email!.Trim());
                }
            }

            receivers = ["aslan.khadizov@alvesta.se", "aslan_argun@hotmail.com"];
            foreach (var email in receivers)
            {
                _service.SendMail(email!, model.Subject!, model.Message!);
            }

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
