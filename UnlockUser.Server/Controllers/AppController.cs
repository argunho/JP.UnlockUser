using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace UnlockUser.Server.Controllers;

[Route("[controller]")]
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
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>();
        if (groups != null)
            return groups.Select(x => x.Name)?.ToList();

        return [];
    }

    [HttpGet("authorized/{param}")]
    public JsonResult? GetAuthorizedEmployees(string param)
    {
        var groupEmployees = IHelpService.GetJsonList<GroupUsersViewModel>("employees") ?? [];
        if (groupEmployees.Count == 0)
        {
            _provider.RenewUsersJsonList(_config);
            Task.Delay(5000);
        }

        groupEmployees = IHelpService.GetJsonList<GroupUsersViewModel>("employees") ?? [];
        if (groupEmployees.Count == 0)
            return null;

        var employees = groupEmployees.First(x => x.Group?.Name == param)?.Employees ?? [];

        // Get a list that can be used on the employees page to select an additional office/manager.
        List<ListViewModel> selections;
        if (param == "Studenter")
        {
            var res = IHelpService.GetJsonList<School>("schools");
            selections = res.OrderBy(x => x.Place).ThenBy(x => x.Name).Select(s => new ListViewModel
            {
                Primary = s.Name,
                Secondary = s.Place
            }).ToList();
        }
        else
        {
            var res = IHelpService.GetJsonList<Manager>("managers");
            selections = res.OrderBy(x => x.Division).ThenBy(x => x.DisplayName).Select(s => new ListViewModel
            {
                Id = s.Username,
                Primary = s.DisplayName,
                Secondary = s.Division
            }).ToList();
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

        return new JsonResult(new { employees = viewList, selections });
    }

    [HttpGet("renew/jsons")]
    public async Task<JsonResult> RenewEmployeesList()
    {
        string res = await _provider.RenewUsersJsonList(_config);
        return new JsonResult(string.IsNullOrEmpty(res) ? null : res);
    }

    #endregion

    #region POST
    #endregion

    #region PUT
    [HttpPut("employee/{group}")]
    public async Task<JsonResult> PutUpdateEmployeeSchool(string group, User model)
    {
        try
        {
            var groupEmployees = IHelpService.GetJsonList<GroupUsersViewModel>("employees") ?? [];
            var employees = groupEmployees.FirstOrDefault(x => x.Group?.Name == group)?.Employees ?? [];
            var employee = employees.FirstOrDefault(x => x.Name == model.Name);
            if (employee == null)
                return new JsonResult(new { alert = "warning", msg = "Ingen anställd hittade med matchande användarnamn" });

            if (group == "Studenter")
                employee.Offices = model.Offices;
            else
                employee.Managers = model.Managers;

            await IHelpService.SaveUpdateJsonFile(groupEmployees, "employees");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Fel: {ex.Message}");
            return new JsonResult(new { alert = "error", msg = $"Något har gått snett. Fel: {ex.Message}" });
        }

        return new JsonResult(null);
    }
    #endregion{

    #region DELETE

    #endregion

    #region Help
    // Get claim
    public string? GetClaim([FromBody] string? name)
    {
        try
        {
            var claims = User.Claims;
            if (!claims.Any()) return null;

            return claims.FirstOrDefault(x => x.Type?.ToLower() == name?.ToLower())?.Value?.ToString();
        }
        catch (Exception)
        {
            return null;
        }
    }
    #endregion
}

#region Unsused
//string classToGet = $"UnlockUser.Server.Models.School";
//Type classType = Type.GetType(classToGet);
//Type listType = typeof(List<>).MakeGenericType(new[] {classType });
//object list = Activator.CreateInstance(listType);
#endregion