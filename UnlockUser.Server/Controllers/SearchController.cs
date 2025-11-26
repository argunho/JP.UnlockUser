using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.DirectoryServices;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SearchController(IActiveDirectory provider, IHttpContextAccessor contextAccessor, IHelp help) : ControllerBase
{
    private readonly IActiveDirectory _provider = provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly ISession? _session = contextAccessor?.HttpContext?.Session;
    private readonly IHelp _help = help;

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

            foreach (string groupName in groupNames)
            {
                DirectorySearcher result = _provider.GetMembers(groupName);

                if(result != null)
                {
                    if (match)
                        result.Filter = $"(&(objectClass=User)(|(cn=*{name}*)(|(displayName=*{name}*)(|(givenName=*{name}*))(|(upn=*{name.ToLower()}*))(sn=*{name}*))))";
                    else
                        result.Filter = $"(&(objectClass=User)(|(cn={name})(|(displayName={name})(|(givenName={name}))(sn={name}))))";
                }

                var user = _provider.GetUsers(result, group);

                users.AddRange(FilteredListOfUsers(user, support, group));
            }
        }
        catch (Exception ex)
        {
            return _help.Error("SearchController: FindUser", ex.Message);
        }

        // If the result got a successful result
        if (users.Count > 0)
        {
            _session?.SetString("GroupName", group);
            return new(new { users = users.OrderBy(x => x.Name) });
        }

        // If result got no results
        return _help.Warning("Inga användarkonto hittades.");
    }

    // Search class students by class and school name
    [HttpGet("students/{department}/{office}")]
    public JsonResult FindClassMembers(string department, string office)
    {
        try
        {
            List<User> users = []; // Empty list of users
            var context = _provider.GetContext(); // Get active derictory context

            _session?.SetString("ManagedOffice", office);
            _session?.SetString("ManagedDepartment", department);
            _session?.SetString("GroupName", "Studenter");

            DirectorySearcher result = _provider.GetMembers("Students");

            result.Filter = $"(&(objectClass=User)((physicalDeliveryOfficeName={office})(department={department})))";
            users = FilteredListOfUsers(_provider.GetUsers(result, ""), false, "Studenter");

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

    #region Helpers
    // Filter
    public List<User> FilteredListOfUsers(List<User> users, bool support,
            string? groupName = null, string? roles = null, string? username = null)
    {
        try
        {
            roles ??= _help.GetClaim("roles") ?? "";
            // If user is not a member from support group, filter users result
            if (!roles.Contains("Support", StringComparison.CurrentCulture))
            {
                username ??= _help.GetClaim("username") ?? "";
                List<GroupUsersViewModel> groups = HelpService.GetListFromFile<GroupUsersViewModel>("employees") ?? [];
                List<User>? employees = groups.FirstOrDefault(x => x.Group.Name == groupName)?.Employees;
                User? sessionUser = employees?.FirstOrDefault(x => x.Name == username);
                List<User> usersToView = [];

                if (sessionUser?.Managers.Count > 0 && groupName != "Studenter" && groupName != "Students")
                {
                    foreach (var user in users)
                    {
                        var managers = _provider.GetUserManagers(user)?.Select(s => s.Username)?.ToList() ?? [];
                        var sessionUserManagers = sessionUser.Managers.Where(x => !x.Disabled).Select(s => s.Username).ToList() ?? [];
                        if (managers.Count > 0)
                        {
                            var matched = sessionUserManagers.Intersect(managers);
                            if (matched.Count() > 0)
                                usersToView.Add(user);
                        }
                    }
                }
                else if(groupName == "Studenter" || groupName == "Students")
                    users = users.Where(x => sessionUser!.Offices.Contains(x.Office!)).ToList();

                users = usersToView;
            } else if(groupName != "Students")
            {
                foreach (var user in users)
                    user.Managers = _provider.GetUserManagers(user);
            }
        }
        catch (Exception ex)
        {
            _help.SaveLogFile(["SearchController: FilteredListOfUsers", $"Fel: {ex.Message}"], "errors");
        }

        return users;
    }
    #endregion
}
