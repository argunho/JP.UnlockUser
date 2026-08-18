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
            var receivers = moderators.Where(x => x.Permissions!.Groups.Contains(model.Group, StringComparer.OrdinalIgnoreCase)).ToList();            
            if (receivers.Count == 0)
                return Ok(_helpService.Warning("E-postmottagare hittades inte"));

            foreach (var receiver in receivers)
            {
                await _service.SendMail(receiver.Email, model.Subject, "unlock.user@alvesta.se");
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
