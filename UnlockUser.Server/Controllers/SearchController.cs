﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.DirectoryServices;

namespace UnlockUser.Server.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize]
public class SearchController(IActiveDirectory provider, IHttpContextAccessor contextAccessor, IHelp help) : ControllerBase
{
    private readonly IActiveDirectory _provider = provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly IHttpContextAccessor _contextAccessor = contextAccessor;
    private readonly ISession _session = contextAccessor.HttpContext.Session;
    private readonly IHelp _help = help;

    #region GET
    // Search one user
    [HttpGet("user/{name}/{group}/{match:bool}")]
    public JsonResult FindUser(string name, string group, bool match = false)
    {
        var users = new List<User>();
        var support = group == "Support";

        try
        {
            List<string> groupNames = support ? ["Students", "Employees"] : [(group == "Studenter" ? "Students" : "Employees")];

            foreach (string groupName in groupNames)
            {
                DirectorySearcher? result = _provider.GetMembers(groupName);

                if (match)
                    result.Filter = $"(&(objectClass=User)(|(cn=*{name}*)(|(displayName=*{name}*)(|(givenName=*{name}*))(|(upn=*{name.ToLower()}*))(sn=*{name}*))))";
                else
                    result.Filter = $"(&(objectClass=User)(|(cn={name})(|(displayName={name})(|(givenName={name}))(sn={name}))))";

                users.AddRange(FilteredListOfUsers(_provider.GetUsers(result, (groupName == "Students" ? "Studenter" : "Personal")), support, groupName));
            }
        }
        catch (Exception ex)
        {
            _help.SaveFile(["FindUser", $"Fel: {ex.Message}"], "errors", "error");
            return Error(ex.Message);
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
            List<User> users = []; // Empty list of users
            var context = _provider.GetContext(); // Get active derictory context

            _session.SetString("ManagedOffice", office);
            _session.SetString("ManagedDepartment", department);
            _session.SetString("GroupName", "Studenter");

            DirectorySearcher result = _provider.GetMembers("Students");

            result.Filter = $"(&(objectClass=User)((physicalDeliveryOfficeName={office})(department={department})))";
            users = FilteredListOfUsers(_provider.GetUsers(result, ""), false, "Studenter");

            if (users.Count > 0)
                return new JsonResult(new { users = users.Distinct().OrderBy(x => x.Department).ThenBy(x => x.Name) });

            return new JsonResult(new { alert = "warning", msg = "Inga användarkonto hittades. Var vänlig kontrollera klass- och skolnamn." });
        }
        catch (Exception ex)
        {
            _help.SaveFile(["FindClassMembers", $"Fel: {ex.Message}"], "errors", "error");
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
        });
    }

    // Filter
    public List<User> FilteredListOfUsers(List<User> users, bool support, string? groupName = null, string? roles = null, string? username = null)
    {
        try
        {
            roles ??= GetClaim("roles") ?? "";
            // If user is not a member from support group, filter users result
            if (!roles.Contains("Support", StringComparison.CurrentCulture))
            {
                username ??= GetClaim("username") ?? "";
                List<User>? employees = (_provider.GetAuthorizedEmployees(groupName))?.FirstOrDefault()?.Employees;
                User? currentUser = employees?.FirstOrDefault(x => x.Name == username);
                List<User> usersToView = [];

                if (currentUser?.Managers.Count > 0 && groupName != "Studenter" && groupName != "Students")
                {
                    foreach (var user in users)
                    {
                        var managers = _provider.GetManagers(user);

                        if (managers.Count > 0)
                        {
                            var matched = currentUser.Managers?.Intersect(managers);
                            if (matched != null)
                                usersToView.Add(user);
                        }
                    }
                }
                else
                    users = users.Where(x => currentUser.Offices.Contains(x.Office)).ToList();

                users = usersToView;
            } else if(groupName != "Students")
            {
                foreach (var user in users)
                    user.Managers = _provider.GetManagers(user);
            }
        }
        catch (Exception ex)
        {

            _help.SaveFile(["FilteredListOfUsers", $"Fel: {ex.Message}"], "errors", "error");
        }

        return users;
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
    #endregion
}
