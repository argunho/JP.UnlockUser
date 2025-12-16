using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.DirectoryServices;
using System.Security.Claims;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SearchController(IActiveDirectory provider, IHttpContextAccessor contextAccessor,
        IHelp help, ILocalService localService, IHelpService helpService) : ControllerBase
{
    private readonly IActiveDirectory _provider = provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly ISession? _session = contextAccessor?.HttpContext?.Session;
    private readonly IHelp _help = help;
    private readonly ILocalService _localService = localService;
    private readonly IHelpService _helpService = helpService;

    #region GET
    // Search one user
    [HttpGet("person/{name}/{group}/{match:bool}")]
    public JsonResult FindUser(string name, string group, bool match = false)
    {
        var users = new List<User>();
        var support = group == "Support";

        try
        {
            List<string> groupNames = support ? ["Students", "Employees"] : [(group == "Studenter" ? "Students" : "Employees")];
            var claims = _help.GetClaims("roles", "username");

            foreach (string groupName in groupNames)
            {
                DirectorySearcher result = _provider.GetMembers(groupName);

                if (result != null)
                {
                    if (match)
                        result.Filter = $"(&(objectClass=User)(|(cn=*{name}*)(|(displayName=*{name}*)(|(givenName=*{name}*))(|(upn=*{name.ToLower()}*))(sn=*{name}*))))";
                    else
                        result.Filter = $"(&(objectClass=User)(|(cn={name})(|(displayName={name})(|(givenName={name}))(sn={name}))))";
                }

                var user = _provider.GetUsers(result, group);

                users.AddRange(_localService.FilteredListOfUsers(user, support, group, claims!["roles"], claims["username"]));
            }

            // If result got no results
            if (users.Count == 0)
                return _help.Warning("Inga användarkonto hittades.");

 
            return new(new { users = users.OrderBy(x => x.Name) });

        }
        catch (Exception ex)
        {
            return _help.Error("SearchController: FindUser", ex.Message);
        }
    }

    // Search class students by class and school name
    [HttpGet("students/{department}/{office}")]
    public JsonResult FindClassMembers(string department, string office)
    {
        try
        {
            List<User> users = []; // Empty list of users
            var context = _provider.GetContext(); // Get active derictory context
            var claims = _help.GetClaims("roles", "username");

            DirectorySearcher result = _provider.GetMembers("Students");

            result.Filter = $"(&(objectClass=User)((physicalDeliveryOfficeName={office})(department={department})))";
            users = _localService.FilteredListOfUsers(_provider.GetUsers(result, ""), false, "Studenter", claims!["roles"], claims["username"]);

            if (users.Count > 0)
                return new JsonResult(new { users = users.Distinct().OrderBy(x => x.Department).ThenBy(x => x.Name) });

            return _help.Warning("Inga användarkonto hittades. Var vänlig kontrollera klass- och skolnamn.");
        }
        catch (Exception ex)
        {
            return _help.Error("SearchController:  FindClassMembers", ex.Message);
        }

    }
    #endregion
}
