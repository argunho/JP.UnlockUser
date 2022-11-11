using UnlockUser.Extensions;
using UnlockUser.Interface;
using UnlockUser.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.DirectoryServices.AccountManagement;
using System.Diagnostics;
using System.DirectoryServices;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace UnlockUser.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly IActiveDirectory _provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly ISession _session;

        public SearchController(IActiveDirectory provider, IHttpContextAccessor contextAccessor)
        {
            _provider = provider;
            _contextAccessor = contextAccessor;
            _session = _contextAccessor.HttpContext.Session;
        }

        #region GET
        // Search one user
        [HttpGet("user/{name}/{group}/{match:bool}")]
        public JsonResult FindUser(string name, string group, bool match = false)
        {
            var users = new List<User>();
            try
            {
                DirectorySearcher result = _provider.GetMembers(group);

                if (match)
                    result.Filter = $"(&(objectClass=User)(|(cn=*{name}*)(|(displayName=*{name}*)(|(givenName=*{name}*))(sn=*{name}*))))";
                else
                    result.Filter = $"(&(objectClass=User)(|(cn={name})(|(displayName={name})(|(givenName={name}))(sn={name}))))";

                users = _provider.GetUsers(result, group);
            }
            catch (Exception e)
            {
                return Error(e.Message);
            }

            // If the result got a successful result
            if (users.Count > 0)
                return new JsonResult(new { users = users.OrderBy(x => x.Name) });

            // If result got no results
            return new JsonResult(new { alert = "warning", msg = "Inga användarkonto hittades." });
        }

        // Search class students by class and school name
        [HttpGet("members/{department}/{office}")]
        public async Task<JsonResult> FindClassMembers(string department, string office)
        {
            try
            {
                List<User> users = new(); // Empty list of users
                var context = _provider.GetContext(); // Get active derictory context

                _session.SetString("Office", office);
                _session.SetString("Department", department);

                DirectorySearcher result = _provider.GetMembers("studenter");

                result.Filter = $"(&(objectClass=User)((physicalDeliveryOfficeName={office})(department={department})))";
                users = _provider.GetUsers(result, "");

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
