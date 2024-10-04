using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Diagnostics;
using System.DirectoryServices.AccountManagement;
using System.Text.Json;
using UnlockUser.Extensions;
using UnlockUser.Interface;

namespace UnlockUser.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize(Roles = "Developer,Manager,Support")]
public class AppController : ControllerBase
{
    private readonly IHttpContextAccessor _contextAccessor;
    private readonly IConfiguration _config;
    private readonly IActiveDirectory _provider;

    public AppController(IHttpContextAccessor contextAccessor, IConfiguration config, IActiveDirectory provider)
    {
        _contextAccessor = contextAccessor;
        _config = config;
        _provider = provider;
    }

    #region GET
    [HttpGet("authorized/employees")]
    public List<GroupUsersViewModel> GetAuthorizedEmployees()
    {
        List<GroupUsersViewModel> groupEmployees = new();
        try
        {
            using StreamReader reader = new(@"wwwroot/json/employees.json");
            var employeesJson = reader.ReadToEnd();
            groupEmployees = JsonConvert.DeserializeObject<List<GroupUsersViewModel>>(employeesJson);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Error UnlockUser: GetEmployees: {ex.Message}");
        }

        return groupEmployees;
    }

    [HttpGet("renew/authorized/employees/list")]
    public async Task<IActionResult> RenewEmployeesList()
    {

        var groupEmployees = new List<GroupUsersViewModel>();
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>();
        var currentList = GetAuthorizedEmployees();
        try
        {
            foreach (var group in groups)
            {
                List<string> members = _provider.GetSecurityGroupMembers(group.Group);
                List<UserPrincipalExtension> users = new();
                var cListByGroup = currentList.FirstOrDefault(x => x.Group?.Name == group.Name)?.Employees;
                foreach (var member in members)
                {
                    users.Add(_provider.FindUserByExtensionProperty(member));
                }

                groupEmployees.Add(new GroupUsersViewModel
                {
                    Group = group,
                    Employees = users.Where(x => x.SamAccountName?.Length > 6 && int.TryParse(x?.SamAccountName.Substring(0, 6), out int number)).Select(s => new User
                    {
                        Name = s.SamAccountName,
                        DisplayName = s.DisplayName,
                        Email = s.DisplayName,
                        Office = s.Office,
                        Title = s.Title,
                        Department = s.Department,
                        Division = s.Division,
                        Manager = s.Manager,
                        Permissions = (cListByGroup != null && cListByGroup.Exists(x => x.Name == s.SamAccountName))
                                        ? cListByGroup.FirstOrDefault(x => x.Name == s.SamAccountName).Permissions
                                        : new List<string> { s.Office }
                    }).Distinct().ToList().OrderBy(o => o.DisplayName).ToList()
                });

            }

            await using FileStream stream = System.IO.File.Create(@"wwwroot/json/employees.json");
            await System.Text.Json.JsonSerializer.SerializeAsync(stream, groupEmployees);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Error UnlockUser: GetEmployees: {ex.Message}");
            return BadRequest(ex.Message);
        }

        return Ok();
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
            var groups = groupEmployees.Where(x => x.Employees.Any(e => e.Name == username)).ToList();
            if (groups.Count == 0)
                return new JsonResult(new { alert = "warning",  msg = "Ingen anställd hittade med matchande användarnamn" });

            foreach (var group in groups)
            {
                foreach (var employee in group.Employees)
                {
                    employee.Permissions = model.Permissions.Count > 0 ? model.Permissions : new List<string> { model.Office };
                }
            }

            await using FileStream stream = System.IO.File.Create(@"wwwroot/json/employees.json");
            await System.Text.Json.JsonSerializer.SerializeAsync(stream, groupEmployees);
        } catch(Exception ex)
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

    #endregion
}
