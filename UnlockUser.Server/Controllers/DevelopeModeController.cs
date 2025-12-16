using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DevelopeModeController(ILocalUserService localService) : ControllerBase
{
    private readonly ILocalUserService _localUserService = localService;


    #region Develope mode
    [HttpGet("check")]
    [AllowAnonymous]
    public IActionResult GetEmployees([FromQuery] string username, [FromQuery] string groupName)
    {
        var user = _localUserService.GetUserFromFile(username, groupName);
        return Ok(user);
    }
    #endregion
}
