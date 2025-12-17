using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Data;
using System.DirectoryServices;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SearchController(IActiveDirectory provider, ILocalUserService localUserService, 
    IHelpService helpService, ICredentialsService credentialsService) : ControllerBase
{
    private readonly IActiveDirectory _provider = provider;
    private readonly ILocalUserService _localUserService = localUserService;
    private readonly IHelpService _helpService = helpService;
    private ICredentialsService _credentialsService = credentialsService;

    private readonly string ctrl = nameof(SearchController);

    #region GET
    // Search one user
    [HttpGet("person/{name}/{group}/{match:bool}")]
    public IActionResult FindUser(string name, string group, bool match = false)
    {
        var usersToView = new List<User>();
        var support = group == "Support";

        try
        {
            List<string> groupNames = support ? ["Students", "Employees"] : [(group == "Studenter" ? "Students" : "Employees")];
            var claims = _credentialsService.GetClaims(["roles", "username"], Request);

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

                var usersToManage = _provider.GetUsers(result!, group).ToList();
                if (!support)
                {
                    usersToManage = _localUserService.Filter(usersToManage, group, claims!["username"]);
                }


                if (usersToManage.Count != 0)
                    usersToView.AddRange(usersToManage);
            }

            // If result got no results
            if (usersToView.Count == 0)
                return Ok(_helpService.Warning("Inga användarkonto hittades."));


            return Ok(new { users = usersToView.OrderBy(x => x.Name) });

        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error($"{ctrl}: {nameof(FindUser)}", ex));
        }
    }

    // Search class students by class and school name
    [HttpGet("students/{school}/{class}")]
    public IActionResult FindClassMembers(string school, string @class)
    {
        try
        {
            List<User> users = []; // Empty list of users
            var context = _provider.GetContext(); // Get active derictory context
            var claims = _credentialsService.GetClaims(["roles", "username"], Request);

            DirectorySearcher result = _provider.GetMembers("Students");

            result.Filter = $"(&(objectClass=User)((physicalDeliveryOfficeName={@class})(department={school})))";

            users = _localUserService.Filter(users, "Students", claims!["username"]);

            if (users.Count > 0)
                return Ok(new { users = users.Distinct().OrderBy(x => x.Department).ThenBy(x => x.Name) });

            return BadRequest(_helpService.Warning("Inga användarkonto hittades. Var vänlig kontrollera klass- och skolnamn."));
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error($"{ctrl}:  {nameof(FindClassMembers)}", ex));
        }

    }
    #endregion
}
