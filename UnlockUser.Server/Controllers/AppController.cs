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

    [NonAction]
    [HttpGet("authorized/{param}")]
    [Obsolete("Depricated")]
    public IActionResult? GetAuthorizedEmployees(string param)
    {
        var groupEmployees = _localFileService.GetListFromFile<GroupUsersViewModel>("employees") ?? [];
        if (groupEmployees.Count == 0)
            return NotFound(_helpService.Warning($"Filen {param} hittades inte. Klicka på Uppdatera listan knappen"));

        var employees = groupEmployees.First(x => x.Group?.Name == param)?.Employees ?? [];

        // Get a list that can be used on the employees page to select an additional office/manager.
        List<ListViewModel> selections;
        if (param == "Studenter")
        {
            var res = _localFileService.GetListFromFile<School>("schools");
            selections = [.. res.OrderBy(x => x.Place).ThenBy(x => x.Name).Select(s => new ListViewModel
            {
                Primary = s.Name,
                Secondary = s.Place
            })];
        }
        else
        {
            var res = _localFileService.GetListFromFile<Manager>("managers");
            selections = [.. res.OrderBy(x => x.Division).ThenBy(x => x.DisplayName).Select(s => new ListViewModel
            {
                Id = s.Username,
                Primary = s.DisplayName,
                Secondary = s.Division
            })];
        }

        var viewList = employees.Select(s => new
        {
            s.Name,
            Primary = s.DisplayName,
            Secondary = s.Office,
            s.Title,
            IncludedList = (param == "Studenter") ? (dynamic)s.Offices.Select(x => new { Primary = x }).ToList()
                           : (dynamic)s.Managers.Select(x => new
                           {
                               x.Username,
                               Primary = x.DisplayName,
                               Secondary = x.Division,
                               BoolValue = x.Disabled,
                               x.Default
                           }).ToList()
        });

        var config = AppConfiguration.Load();

        return Ok(new { employees = viewList, selections, updated = config.LastUpdatedDate });
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
            var groupEmployees = _localFileService.GetListFromFile<GroupUsersViewModel>("employees") ?? [];
            var employees = groupEmployees.FirstOrDefault(x => x.Group?.Name == group)?.Employees ?? [];
            var employee = employees.FirstOrDefault(x => x.Name == model.Name);
            if (employee == null)
                return NotFound(_helpService.NotFound("Anställd"));

            if (group == "Studenter")
                employee.Offices = model.Offices;
            else
                employee.Managers = model.Managers;

            await _localFileService.SaveUpdateFile(groupEmployees, "employees");
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error($"{ctrl}: {nameof(PutUpdateEmployeeSchool)}", ex));
        }

        return Ok();
    }
    #endregion
}