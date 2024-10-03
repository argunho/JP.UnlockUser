using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.DirectoryServices.AccountManagement;
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

    public AppController(IHttpContextAccessor contextAccessor,IConfiguration config, IActiveDirectory provider)
    {
        _contextAccessor = contextAccessor;
        _config = config;
        _provider = provider;
    }

    #region GET
    [HttpGet("authorized/personnel")]
    public List<GroupUsersViewModel> GetMemebers()
    {
        var groupMemebers = new List<GroupUsersViewModel>();
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>();
        try
        {
            foreach (var group in groups)
            {
                List<Principal> members = _provider.GetSecurityGroupMembers(group.Group);
                //List<UserPrincipalExtension> users = new List<UserPrincipalExtension>();    
                //foreach (var member in members)
                //    users.Add(_provider.FindUserByExtensionProperty(member));

                groupMemebers.Add(new GroupUsersViewModel
                {
                    Group = group,
                    //Employees = members.OrderBy(x => x.Office).ToList()
                    Employees = members.Select(s => new User
                    {
                       Name = s.Name,
                       DisplayName = s.DisplayName,
                       Email = s.UserPrincipalName
                       //Office = s.Office,
                       //Title = s.Title,
                       //Department = s.Department,
                       //Division = s.Division,
                       //Manager = s.Manager
                    }).Distinct().ToList().OrderBy(o => o.Office).ToList()
                });
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Error UnlockUser: GetEmployees: {ex.Message}");
        }

        return groupMemebers;
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
