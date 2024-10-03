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
    [HttpGet("authorized/personnel")]
    public List<GroupUsersViewModel> GetMemebers()
    {
        List<GroupUsersViewModel> groupMembers = new();
        try
        {
            using StreamReader reader = new(@"wwwroot/json/employees.json");
            var employeesJson = reader.ReadToEnd();
            groupMembers = JsonConvert.DeserializeObject<List<GroupUsersViewModel>>(employeesJson);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Error UnlockUser: GetEmployees: {ex.Message}");
        }

        return groupMembers;
    }

    [HttpGet("renew/authorized/personnel/list")]
    public async Task<IActionResult> RenewMemebersList()
    {

        var groupMembers = new List<GroupUsersViewModel>();
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>();
        try
        {
            foreach (var group in groups)
            {
                List<string> members = _provider.GetSecurityGroupMembers(group.Group);
                List<UserPrincipalExtension> users = new List<UserPrincipalExtension>();
                foreach (var member in members)
                    users.Add(_provider.FindUserByExtensionProperty(member));

                groupMembers.Add(new GroupUsersViewModel
                {
                    Group = group,
                    Employees = users.Where(x => x?.SamAccountName.Length > 6 && int.TryParse(x?.SamAccountName.Substring(0,6), out int number)).Select(s => new User
                    {
                        Name = s.Name,
                        DisplayName = s.DisplayName,
                        Email = s.DisplayName,
                        Office = s.Office,
                        Title = s.Title,
                        Department = s.Department,
                        Division = s.Division,
                        Manager = s.Manager
                    }).Distinct().ToList().OrderBy(o => o.Office).ToList()
                });
            }

            await using FileStream stream = System.IO.File.Create(@"wwwroot/json/employees.json");
            await System.Text.Json.JsonSerializer.SerializeAsync(stream, groupMembers);
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

    #endregion

    #region DELETE

    #endregion

    #region Help

    #endregion
}
