using UnlockUser.Extensions;
using UnlockUser.Interface;
using UnlockUser.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;

namespace UnlockUser.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly IActiveDirectoryProvider _provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly ISession _session;
        public SearchController(IActiveDirectoryProvider provider, IHttpContextAccessor contextAccessor)
        {
            _provider = provider;
            _contextAccessor = contextAccessor;
            _session = _contextAccessor.HttpContext.Session;
        }

        #region GET
        [HttpGet("user/{name}/{match:bool}/{capitalize:bool}")] // Search one user
        public JsonResult FindUser(string name, bool match = false, bool capitalize = false)
        {
            List<User> users = new List<User>(); // Empty list of user object

            try
            {
                var groupName = User.Claims.ToList().FirstOrDefault(x => x.Type == "GroupToManage")?.Value ?? "";
                var group = _provider.FindGroupName(groupName); // Get group by name

                if (match) // If search is by keywords matching
                {
                    // Get all members into "Group to manage" group that matching with search keywords
                    var members = group.GetMembers(true).Where(x => (!capitalize
                            ? (x.Name.ToLower().Contains(name.ToLower()) || x.DisplayName.ToLower().Contains(name.ToLower()))
                            : (x.Name.Contains(name) || x.DisplayName.Contains(name)))).ToList();

                    if (members?.Count > 0)
                    {
                        // Loopin of all members
                        foreach (Principal p in members)
                        {
                            var user = _provider.FindUserByExtensionProperty(p.Name); // Find users with extension property 
                                                                                      // Add user to this empty list of users 
                            users.Add(new User
                            {
                                Name = user.Name,
                                DisplayName = user?.DisplayName ?? "",
                                Email = user.UserPrincipalName,
                                Office = user.Office,
                                Department = user.Department
                            });
                        }
                    }
                }
                else
                {
                    // Check if the person he is looking for is in the "Group to control" group
                    var member = group?.GetMembers(true).FirstOrDefault(x => x.Name == name || x.DisplayName == name);

                    if (member == null) // Return if member not found by name
                        return new JsonResult(new
                        {
                            alert = "warning",
                            warning = true,
                            msg = $"Användaren {name} hittades inte. Deta kan bli så att användaren {name} tillhör " +
                                        $"inte studentgruppen eller felstavat namn/användarnamn. " +
                                        $"Var vänlig, kontrollera namn/användarnamn."
                        });

                    var user = _provider.FindUserByExtensionProperty(member.Name); // Find users with extension property 

                    if (user != null)
                    {
                        users.Add(new User
                        {
                            Name = user.Name,
                            DisplayName = user.DisplayName,
                            Email = user.UserPrincipalName,
                            Office = user.Office,
                            Department = user.Department
                        });
                    }
                }

                group.Dispose();

                // If the search got a successful result
                if (users.Count > 0)
                    return new JsonResult(new { users = users.OrderBy(x => x.Name) });

                // If search got no results
                return new JsonResult(new { alert = "warning", msg = "Inga användarkonto hittades." });
            }
            catch (Exception ex)
            {
                return Error(ex.Message);
            }
        }

        [HttpGet("members/{department}/{office}")] // Search class students by class and school name
        public async Task<JsonResult> FindClassMembers(string department, string office)
        {
            try
            {
                List<User> users = new List<User>(); // Empty list of users
                var context = _provider.GetContext(); // Get active derictory context

                _session.SetString("Office", office);
                _session.SetString("Department", department);

                // Methods to find the class students
                using (UserPrincipalExtension searchDepartment = new UserPrincipalExtension(context) { Department = String.Format("*{0}*", department) }) // Using a user extension class whose job it is to extend user options.
                using (PrincipalSearcher searcherDepartment = new PrincipalSearcher(searchDepartment))
                using (Task<PrincipalSearchResult<Principal>> taskDepartment = Task.Run<PrincipalSearchResult<Principal>>(() => searcherDepartment.FindAll()))
                {
                    // Looping all members to search by department
                    foreach (UserPrincipalExtension member in (await taskDepartment))
                    {
                        using (member)
                        {
                            if (member.Office.ToLower() == office.ToLower()) // If member has same office
                            {
                                users.Add(new User
                                {
                                    Name = member.Name,
                                    DisplayName = member.DisplayName,
                                    Email = member.UserPrincipalName,
                                    Department = member.Department,
                                    Office = member.Office,
                                    Title = member.Title
                                });
                            }
                        }
                    }
                }

                if (users.Count > 0)
                    return new JsonResult(new { users = users.Distinct().OrderBy(x => x.Name) });

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
        #endregion
    }
}