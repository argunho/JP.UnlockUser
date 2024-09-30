using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using UnlockUser.Interface;

namespace UnlockUser.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize(Roles = "Support,Developer,Manager")]
    public class AppController : ControllerBase
    {
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly ILogger _logger;
        private readonly IConfiguration _config;
        private readonly IActiveDirectory _provider;

        public AppController(IHttpContextAccessor contextAccessor, ILogger logger, IConfiguration config, IActiveDirectory provider)
        {
            _contextAccessor = contextAccessor;
            _logger = logger;
            _config = config;
            _provider = provider;
        }

        #region GET
        [HttpGet("members")]
        public List<GroupUsersViewModel> GetMemebers()
        {
            var groupMemebers = new List<GroupUsersViewModel>();
            var groups = _config.GetSection("Groups").Get<List<GroupModel>>();
            try
            {
                foreach (var group in groups)
                {
                    var result = _provider.GetMembers(group.Group);
                    var members = _provider.GetUsers(result, group.Group);
                    groupMemebers.Add(new GroupUsersViewModel
                    {
                        Group = group,
                        Members = members
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
}
