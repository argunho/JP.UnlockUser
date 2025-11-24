using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Developer,Manager,Support")]
public class AppController(IConfiguration config, IActiveDirectory provider, IHelp help) : ControllerBase
{
    private readonly IConfiguration _config = config;
    private readonly IActiveDirectory _provider = provider;
    private readonly IHelp _help = help;

    #region GET
    [HttpGet("groups")]
    public List<string> GetGrous()
    {
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];
        if (groups.Count > 0)
            return [.. groups.Select(x => x.Name)];

        return [];
    }

    [HttpGet("authorized/{param}")]
    public JsonResult? GetAuthorizedEmployees(string param)
    {
        var groupEmployees = HelpService.GetListFromFile<GroupUsersViewModel>("employees") ?? [];
        if (groupEmployees.Count == 0)
            return _help.Warning($"Filen {param} hittades inte. Klicka på Uppdatera listan knappen");

        var employees = groupEmployees.First(x => x.Group?.Name == param)?.Employees ?? [];

        // Get a list that can be used on the employees page to select an additional office/manager.
        List<ListViewModel> selections;
        if (param == "Studenter")
        {
            var res = HelpService.GetListFromFile<School>("schools");
            selections = [.. res.OrderBy(x => x.Place).ThenBy(x => x.Name).Select(s => new ListViewModel
            {
                Primary = s.Name,
                Secondary = s.Place
            })];
        }
        else
        {
            var res = HelpService.GetListFromFile<Manager>("managers");
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

        return new (new { employees = viewList, selections, updated = config.LastUpdatedDate });
    }

    [HttpGet("renew/jsons")]
    public async Task<JsonResult> RenewEmployeesList()
    {
        string res = await _provider.RenewUsersJsonList(_config);
        HelpService.UpdateConfigFile("appconfig", "LastUpdatedDate", DateTime.Now.ToString("yyyy.MM.dd HH:mm:ss"));
        return new(string.IsNullOrEmpty(res) ? null : res);
    }
    #endregion

    #region PUT
    [HttpPut("employee/{group}")]
    public async Task<JsonResult> PutUpdateEmployeeSchool(string group, User model)
    {
        try
        {
            var groupEmployees = HelpService.GetListFromFile<GroupUsersViewModel>("employees") ?? [];
            var employees = groupEmployees.FirstOrDefault(x => x.Group?.Name == group)?.Employees ?? [];
            var employee = employees.FirstOrDefault(x => x.Name == model.Name);
            if (employee == null)
                return _help.NotFound("Anställd");

            if (group == "Studenter")
                employee.Offices = model.Offices;
            else
                employee.Managers = model.Managers;

            await HelpService.SaveUpdateFile(groupEmployees, "employees");
        }
        catch (Exception ex)
        {
            return _help.Error("AppController: PutUpdateEmployeeSchool", ex.Message);
        }

        return new(null);
    }
    #endregion
}

#region Unsused
//string classToGet = $"UnlockUser.Server.Models.School";
//Type classType = Type.GetType(classToGet);
//Type listType = typeof(List<>).MakeGenericType(new[] {classType });
//object list = Activator.CreateInstance(listType);
#endregion