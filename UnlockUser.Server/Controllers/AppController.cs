using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Developer,Manager,Support")]
public class AppController(IConfiguration config, ILocalUserService localUserService,
    IHelpService helpService, ILocalFileService localFileService) : ControllerBase
{
    private readonly IConfiguration _config = config;
    private readonly ILocalUserService _localUserService = localUserService;
    private readonly IHelpService _helpService = helpService;
    private readonly ILocalFileService _localFileService = localFileService;

    private readonly string ctrl = nameof(AppController);

    #region GET
    [HttpGet("groups")]
    public List<string?> GetGrous()
    {
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];
        if (groups.Count > 0)
            return [.. groups.Select(x => x.Name)];

        return [];
    }

    [HttpGet("renew/jsons")]
    public async Task<IActionResult> RenewEmployeesList()
    {
        try
        {
            await _localUserService.RenewUsersJsonList();
            _localFileService.UpdateConfigFile("appconfig", "LastUpdatedDate", DateTime.Now.ToString("yyyy.MM.dd HH:mm:ss"));
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error($"{ctrl}: {nameof(RenewEmployeesList)}", ex));
        }
    }
    #endregion

    #region PUT
    [HttpPut("employee/{group}")]
    public async Task<IActionResult> PutUpdateEmployeeSchool(string group, User model)
    {
        try
        {
            var employees = _localFileService.GetListFromFile<UserViewModel>("employees") ?? [];
            var employee = employees.FirstOrDefault(x => x.Name == model.Name);
            if (employee == null)
                return NotFound(_helpService.NotFound("Anställd"));

            if (group == "Studenter")
                employee.Permissions!.Offices = model.Permissions!.Offices;
            else
                employee.Permissions!.Managers = model.Permissions!.Managers;

            await _localFileService.SaveUpdateFile(employees, "employees");
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error($"{ctrl}: {nameof(PutUpdateEmployeeSchool)}", ex));
        }

        return Ok();
    }
    #endregion
}