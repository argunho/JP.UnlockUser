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
                Primary = s.DisplayName,
                Secondary = s.Division
            }).ToList();
        }

        var viewList = employees.Select(s => new
        {
            Primary = s.DisplayName,
            Secondary = s.Office,
            s.Title,
            IncludedList = (param == "Studenter") ? s.Offices.Select(x => new ListViewModel {  Primary = x }).ToList()
                           : s.Managers.Select(x => new ListViewModel { Primary = x.DisplayName, Secondary = x.Division, BoolValue = x.Disabled }).ToList()
        });

        return new JsonResult(new { employees = viewList, selections });
    }

    [HttpGet("renew/jsons")]
    public async Task<IActionResult> RenewEmployeesList()
    {
        string res = await _provider.RenewUsersJsonList(_config);
        return string.IsNullOrEmpty(res) ? Ok() : Ok(res);
    }
    #endregion

    #region POST
    #endregion

    #region PUT
    [HttpPut("update/employee/data/{username}")]
    public async Task<JsonResult> PutUpdateEmployeeData(string username, User model)
    {
        try
        {
            var groupEmployees = IHelpService.GetJsonList<GroupUsersViewModel>("employees") ?? [];
            var exists = false;
            foreach (var group in groupEmployees)
            {
                var employee = group.Employees?.FirstOrDefault(x => x.Name == username);
                if (employee != null)
                {
                    employee.Offices = model?.Offices.Count > 0 ? model.Offices : [model?.Office];
                    exists = true;
                }
            }

            if (!exists)
                return new JsonResult(new { alert = "warning", msg = "Ingen anställd hittade med matchande användarnamn" });

            await using FileStream stream = System.IO.File.Create(@"wwwroot/json/employees.json");
            await System.Text.Json.JsonSerializer.SerializeAsync(stream, groupEmployees);
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
    public string? GetClaim(string? name)
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