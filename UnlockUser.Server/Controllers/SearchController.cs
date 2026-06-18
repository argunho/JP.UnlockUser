using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using System.Data;
using System.DirectoryServices;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SearchController(IActiveDirectory provider, ILocalUserService localUserService,
    IHelpService helpService, ICredentialsService credentialsService, IMemoryCache memoryCache, IConfiguration config) : ControllerBase
{
    private readonly IActiveDirectory _provider = provider;
    private readonly ILocalUserService _localUserService = localUserService;
    private readonly IHelpService _helpService = helpService;
    private readonly ICredentialsService _credentialsService = credentialsService;
    private readonly IMemoryCache _memoryCache = memoryCache;
    private readonly IConfiguration _config = config;

    #region GET
    // Search one user
    [HttpGet("person/{name}/{group}/{match:bool}")]
    public async Task<IActionResult> FindUser(string name, string group, bool match = false)
    {
        var usersToView = new List<User>();
        bool supportModel = string.Equals(group.ToString(), "Support", StringComparison.OrdinalIgnoreCase);

        try
        {
            List<string> groupNames = supportModel ? ["Students", "Employees"] : [(group == "Studenter" ? "Students" : "Employees")];
            var claims = _credentialsService.GetClaims(["roles", "username"]);

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
                if (!supportModel)
                {
                    usersToManage = await _localUserService.Filter(usersToManage, group, claims!["username"]);
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
            return BadRequest(_helpService.Error(ex));
        }
    }



    // Search class students by class and school name
    [HttpGet("students/{school}/{class}")]
    public async Task<IActionResult> FindClassMembers(string school, string @class)
    {
        try
        {
            List<User> users = []; // Empty list of users
            var context = _provider.GetContext(); // Get active derictory context
            var claims = _credentialsService.GetClaims(["roles", "username"]);

            DirectorySearcher result = _provider.GetMembers("Students");

            result.Filter = $"(&(objectClass=User)((physicalDeliveryOfficeName={@class})(department={school})))";

            users = await _localUserService.Filter(users, "Students", claims!["username"]);

            if (users.Count > 0)
                return Ok(new { users = users.Distinct().OrderBy(x => x.Department).ThenBy(x => x.Name) });

            return BadRequest(_helpService.Warning("Inga användarkonto hittades. Var vänlig kontrollera klass- och skolnamn."));
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }

    }
    #endregion
}
