using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using System.Security.Claims;
using System.Text;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthenticationController(IActiveDirectory provider, IConfiguration config, IHttpContextAccessor contextAccessor, IDistributedCache distributedCache, 
    IHelpService help, ICredentialsService credentials) : ControllerBase
{
    private readonly IActiveDirectory _provider = provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly IConfiguration _config = config; // Implementation of configuration file => ActiveDerictory/appsettings.json
    private readonly ISession? _session = contextAccessor?.HttpContext?.Session;
    private readonly IDistributedCache _distributedCache = distributedCache;
    private readonly IHelpService _help = help;
    private readonly ICredentialsService _credentials = credentials;


    private readonly string ctrl = nameof(AuthenticationController);

    #region POST   
    [HttpPost]
    public async Task<JsonResult> PostLogin([FromBody] LoginViewModel model)
    {
        // Forms filled out incorrectly
        if (!ModelState.IsValid)
            return new(_help.Warning());

        try
        {
            int loginAttempt = _session?.GetInt32("LoginAttempt") ?? 0;
            var timeLeft = ProtectAccount(loginAttempt);
            if (!string.IsNullOrEmpty(timeLeft)) 
                return new(new { timeLeft });

            // Validate username and password
            var isAutheticated = _provider.AccessValidation(model?.Username, model?.Password);

            //Incorrect username or password
            if (!isAutheticated)
            {
                // If the user tried to put in a wrong password, save this like +1 a wrong attempt and the max is 4 attempts
                _session?.SetInt32("LoginAttempt", loginAttempt += 1);
                return new(_help.Warning($"Felaktig användarnamn eller lösenord. {4 - loginAttempt} försök kvar."));
            }

            _session?.Remove("LoginAttempt");
            _session?.Remove("LoginBlockTime");

            var permissionGroups = _config.GetSection("Groups").Get<List<GroupModel>>();
            var user = _provider.FindUserByExtensionProperty(model!.Username!);
            var userGroups = _provider.GetUserGroups(user);
            permissionGroups?.RemoveAll(x => !userGroups.Contains(x.PermissionGroup!));
            permissionGroups ??= [];
            List<string> roles = [];

            if (_provider.MembershipCheck(user, "Azure-Utvecklare Test"))
                roles.Add("Developer");


            if (_provider.MembershipCheck(user, "TEIS IT avdelning") || roles.IndexOf("Developer") > -1)
            {
                roles.Add("Support");
                permissionGroups.Add(new GroupModel
                {
                    Name = "Support",
                    Group = "Students, Employees"
                });
            }

            // Failed! Permission missed
            if (permissionGroups.Count == 0 && roles.Count == 0)
                return new(_help.Warning("Åtkomst nekad! Behörighet saknas."));
          
            var permissions = permissionGroups.OrderBy(x => x.Name).Select(s => new GroupModel
            {
                Name = s.Name,
                Group = s.Group
            }).ToList();

            List<Claim> claims = [];
            claims.Add(new(ClaimTypes.Name, user?.Name));
            claims.Add(new("Email", user.EmailAddress));
            claims.Add(new("DisplayName", user.DisplayName));
            claims.Add(new("Username", user.Name));
            claims.Add(new("Manager", user.Manager));
            claims.Add(new("Office", user.Office));
            claims.Add(new("Department", user.Department));
            claims.Add(new("Division", user.Division));
            claims.Add(new("Groups", JsonConvert.SerializeObject(permissions)));
            claims.Add(new("Roles", string.Join(",", roles)));

            if (roles.IndexOf("Support") > -1)
                claims.Add(new("Access", "access"));

            _session?.SetString("Password", model.Password);

            // If the logged user is found, create Jwt Token to get all other information and to get access to other functions
            return new(_credentials.GenerateJwtToken(
                    claims,
                    _config["JwtSettings:Key"]!,
                    [.. roles.Distinct()],
                    false));
        }
        catch (Exception ex)
        {
            return new(await _help.Error($"{ctrl}: {nameof(PostLogin)}", ex));
        }
    }
    #endregion

    #region Delete
    [HttpDelete("logout/{token}")]
    public async Task<JsonResult> Logout(string token)
    {
        try
        {
            var _session = HttpContext.Session;
            _session.Remove("Username");
            _session.Remove("FullName");
            _session.Remove("Email");
            _session.Remove("Password");
            _session.Remove("GroupToManage");
            _session.Remove("PasswordResetGroup");
            _session.Remove("LoginAttempt");
            _session.Remove("LoginBlockTime");

            var tokenKey = $"tokens:{token}:deactivated";
            await _distributedCache.SetStringAsync(tokenKey, " ", new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = DateTimeOffset.UtcNow
            });
        }
        catch (Exception ex)
        {
            return new(_help.Error($"{ctrl} {nameof(Logout)}", ex));
        }

        return new(true);
    }
    #endregion
    
    #region Helpers
    // Protection against account blocking after several unsuccessful attempts to authenticate
    public string? ProtectAccount(int attempt)
    {
        var blockTime = _session?.GetString("LoginBlockTime") ?? null;
        if (attempt >= 3)
        {
            blockTime = DateTime.Now.ToString();
            _session?.SetString("LoginBlockTime", blockTime);
            _session?.SetInt32("LoginAttempt", 0);
        }

        // Check if the user is blocked from further attempts to enter incorrect data
        // Unclock time after 4 incorrect passwords

        if (blockTime == null)
            return null;

        DateTime blockTimeStamp = Convert.ToDateTime(blockTime);
        var timeLeftTicks = DateTime.Now.Ticks - blockTimeStamp.AddMinutes(30).Ticks;

        if (timeLeftTicks > 0) return null;

        var timeLeft = new DateTime(Math.Abs(timeLeftTicks));

        return timeLeft.ToString("T");
    }
    #endregion
}