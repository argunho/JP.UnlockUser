using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Newtonsoft.Json;
using Onboarding.Server.Services;
using System.Diagnostics;

namespace UnlockUser.Server.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize(Roles = "Developer,Manager,Support")]
public class AppController(IHttpContextAccessor contextAccessor, IConfiguration config, IActiveDirectory provider, IHubContext<HubService> hubConnection, IHelp help) : ControllerBase
{
    private readonly IHttpContextAccessor _contextAccessor = contextAccessor;
    private readonly IConfiguration _config = config;
    private readonly IActiveDirectory _provider = provider;
    private readonly IHubContext<HubService> _hubConnection = hubConnection;
    private readonly IHelp _help = help;

    #region GET
    [HttpGet("authorized/employees")]
    public List<GroupUsersViewModel>? GetAuthorizedEmployees()
        => _provider.GetAuthorizedEmployees();

    [HttpGet("renew/authorized/employees/list")]
    public async Task<IActionResult> RenewEmployeesList()
    {
        string res = await _provider.RenewUsersJsonList(_config);
        return string.IsNullOrEmpty(res) ? Ok() : Ok(res);
    }

    [HttpGet("update/service/status/{status:bool}")]
    public async Task<IActionResult> UpdateServiceStatus(bool status)
    {
        try
        {
            _help.UpdateConfigFile("appconfig", "ServiceWork", (!status).ToString());

            var user = GetClaim("email");
            await _hubConnection.Clients.Group("onboarding").SendAsync("UpdateServiceStatus", !status, user, $"Session updated: {DateTime.Now:yyyy.MM.dd HH:mm:ss}");
        }
        catch (Exception ex)
        {
            return Ok(status);
        }
        return Ok(!status);
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
            var groupEmployees = GetAuthorizedEmployees();
            var exists = false;
            foreach (var group in groupEmployees)
            {
                var employee = group.Employees.FirstOrDefault(x => x.Name == username);
                if (employee != null)
                {
                    employee.Offices = model.Offices.Count > 0 ? model.Offices : new List<string> { model.Office };
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
//{
//    List<GroupUsersViewModel> groupEmployees = new();
//    try
//    {
//        using StreamReader reader = new (@"wwwroot/json/employees.json");
//        var employeesJson = reader.ReadToEnd();
//            groupEmployees = JsonConvert.DeserializeObject<List<GroupUsersViewModel>>(employeesJson);
//    }
//    catch (Exception ex)
//    {
//        Debug.WriteLine($"Error UnlockUser: GetEmployees: {ex.Message}");
//    }

//    return groupEmployees;
//}

//var groupEmployees = new List<GroupUsersViewModel>();
//var groups = _config.GetSection("Groups").Get<List<GroupModel>>();
//var currentList = GetAuthorizedEmployees();
//try
//{
//    foreach (var group in groups)
//    {
//        List<string> members = _provider.GetSecurityGroupMembers(group.Group);
//        List<User> employees = [];
//        var cListByGroup = currentList.FirstOrDefault(x => x.Group?.Name == group.Name)?.Employees;
//        foreach (var member in members)
//        {
//            UserPrincipalExtension user = _provider.FindUserByExtensionProperty(member);

//            var userOffices = cListByGroup?.FirstOrDefault(x => x.Name == user.SamAccountName)?.Offices ?? [];
//            if (userOffices.IndexOf(user.Office) == -1)
//                userOffices = [user.Office];

//            employees.Add(new User
//            {
//                Name = user.SamAccountName,
//                DisplayName = user.DisplayName,
//                Email = user.EmailAddress,
//                Office = user.Office,
//                Title = user.Title,
//                Department = user.Department,
//                Division = user.Division,
//                Manager = user.Manager,
//                Managers = group.Manage != "Students" ? _provider.GetManagers(user) : [],
//                Offices = userOffices
//            });
//        }

//        groupEmployees.Add(new GroupUsersViewModel
//        {
//            Group = group,
//            Employees = [.. employees.Distinct().ToList().OrderBy(o => o.DisplayName)]
//        });
//    }

//    await using FileStream stream = System.IO.File.Create(@"wwwroot/json/employees.json");
//    await System.Text.Json.JsonSerializer.SerializeAsync(stream, groupEmployees);
//}
//catch (Exception ex)
//{
//    Debug.WriteLine($"Error UnlockUser: GetEmployees: {ex.Message}");
//    return BadRequest(ex.Message);
//}
#endregion