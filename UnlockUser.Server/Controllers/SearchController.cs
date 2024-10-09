using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.DirectoryServices;

namespace UnlockUser.Server.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize]
public class SearchController(IActiveDirectory provider, IHttpContextAccessor contextAccessor, IConfiguration config) : ControllerBase
{
    private readonly IActiveDirectory _provider = provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly IHttpContextAccessor _contextAccessor = contextAccessor;
    private readonly ISession _session = contextAccessor.HttpContext.Session;
    private readonly IConfiguration _config = config;

    #region GET
    // Search one user
    [HttpGet("user/{name}/{group}/{match:bool}")]
    public JsonResult FindUser(string name, string group, bool match = false)
    {
        var users = new List<User>();

        try
        {
            var groupName = group.ToLower();
            DirectorySearcher? result = _provider.GetMembers(group);

            if (match)
                result.Filter = $"(&(objectClass=User)(|(cn=*{name}*)(|(displayName=*{name}*)(|(givenName=*{name}*))(|(upn=*{name.ToLower()}*))(sn=*{name}*))))";
            else
                result.Filter = $"(&(objectClass=User)(|(cn={name})(|(displayName={name})(|(givenName={name}))(sn={name}))))";

            users = FilteredListOfUsers(_provider.GetUsers(result, groupName), groupName);
        }
        catch (Exception e)
        {
            return Error(e.Message);
        }

        // If the result got a successful result
        if (users.Count > 0)
        {
            _session.SetString("GroupName", group);
            return new JsonResult(new { users = users.OrderBy(x => x.Name) });
        }

        // If result got no results
        return new JsonResult(new { alert = "warning", msg = "Inga användarkonto hittades." });
    }

    // Search class students by class and school name
    [HttpGet("members/{department}/{office}")]
    public JsonResult FindClassMembers(string department, string office)
    {
        try
        {
            List<User> users = new(); // Empty list of users
            var context = _provider.GetContext(); // Get active derictory context

            _session.SetString("ManagedOffice", office);
            _session.SetString("ManagedDepartment", department);
            _session.SetString("GroupName", "Studenter");

            DirectorySearcher result = _provider.GetMembers("studenter");

            result.Filter = $"(&(objectClass=User)((physicalDeliveryOfficeName={office})(department={department})))";
            users = FilteredListOfUsers(_provider.GetUsers(result, ""), "studenter");

            if (users.Count > 0)
                return new JsonResult(new { users = users.Distinct().OrderBy(x => x.Department).ThenBy(x => x.Name) });

            return new JsonResult(new { alert = "warning", msg = "Inga användarkonto hittades. Var vänlig kontrollera klass- och skolnamn." });
        }
        catch (Exception ex)
        {
            return Error(ex.Message);
        }

    }
    #endregion

    #region Helpers
    // Return message if sommething went wrong.
    public JsonResult Error(string msg)
    {
        // Activate a button in the user interface for sending an error message to the system developer if the same error is repeated more than two times during the same session
        var repeated = _session.GetInt32("RepeatedError") ?? 0;
        _session.SetInt32("RepeatedError", repeated += 1);
        return new JsonResult(new
        {
            alert = "warning",
            msg = "Något har gått snett. Var vänlig försök igen.",
            repeatedError = repeated,
            errorMessage = msg
        }); //Something went wrong, please try again later
    }

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

    // Filter
    public List<User> FilteredListOfUsers(List<User> users, string groupName)
    {
        var roles = GetClaim("roles");

        // If user is not a member from developers group, filter users result
        if (roles != null && !roles.Contains("Developer", StringComparison.CurrentCulture))
        {
            var manager = GetClaim("manager");
            var office = GetClaim("office")?.ToLower();
            var division = GetClaim("division")?.ToLower();
            var userName = GetClaim("username");
            var permissions = GetClaim("permissions").ToLower().Split(",");

            users = users.Where(x => x.Office == office || 
                (x.Division != null && x.Division.ToLower().Contains(division, StringComparison.CurrentCulture) 
                || division.Contains(x.Division.ToLower(), StringComparison.CurrentCulture))).ToList();

            //if (groupName != "studenter")
            //{
            //    if (!roles.Contains("Manager", StringComparison.CurrentCulture))
            //        users = users.Where(x => x.Manager == manager || x.Division?.ToLower() == division).ToList();
            //    else
            //        users = users.Where(x => x.Manager == manager || x.Manager.Contains($"CN={userName}", StringComparison.CurrentCulture) || (x.Division != null && x.Division.ToLower().Contains(division, StringComparison.CurrentCulture) || division.Contains(x.Division.ToLower())).ToList();
            //}
            //else if (!roles.Contains("Support", StringComparison.CurrentCulture))
            //{
            //    if (office == "Gymnasiet yrkesvux lärvux".ToLower())
            //        office = "Allbo Lärcenter gymnasieskola".ToLower();

            //    users = users.Where(x => x.Office == office || (x.Division != null && x.Division.ToLower().Contains(division, StringComparison.CurrentCulture) || division.Contains(x.Division.ToLower()))).ToList();
            //    //if (users?.Count(x => x.Office?.ToLower() == office) > 0)
            //    //    users.RemoveAll(x => x.Office?.ToLower() != office);
            //    //else
            //    //    users.RemoveAll(x => !office.Contains(x.Office.ToLower()));
            //}
        }

        return users;
    }
    #endregion
}
