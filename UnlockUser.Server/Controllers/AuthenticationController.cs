using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace UnlockUser.Server.Controllers;

[Route("[controller]")]
[ApiController]
public class AuthenticationController(IActiveDirectory provider, IConfiguration config, IHttpContextAccessor contextAccessor, IHelp help, IDistributedCache distributedCache) : ControllerBase
{
    private readonly IActiveDirectory _provider = provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly IConfiguration _config = config; // Implementation of configuration file => ActiveDerictory/appsettings.json
    private readonly ISession? _session = contextAccessor?.HttpContext?.Session;
    private readonly IDistributedCache _distributedCache = distributedCache;
    private readonly IHelp _help = help;


    #region POST
    // Log in with another account if authentication with windows username is failed or to authorize another user
    [HttpPost]
    public JsonResult PostLogin([FromBody] LoginViewModel model)
    {
        if (!ModelState.IsValid)// Forms filled out incorrectly
            return _help.Warning();

        try
        {
            int loginAttempt = _session?.GetInt32("LoginAttempt") ?? 0;
            var response = ProtectAccount(loginAttempt);
            if (response != null) return response;

            // Validate username and password
            var isAutheticated = _provider.AccessValidation(model?.Username, model?.Password);

            //Incorrect username or password
            if (!isAutheticated)
            {
                // If the user tried to put in a wrong password, save this like +1 a wrong attempt and the max is 4 attempts
                _session?.SetInt32("LoginAttempt", loginAttempt += 1);

                return new(new
                {
                    color = "error",
                    msg = $"<b>Felaktig användarnamn eller lösenord.</b><br/> {4 - loginAttempt} försök kvar."
                });
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
                    Manage = "Students, Employee"
                });
            }

            // Failed! Permission missed
            if (permissionGroups.Count == 0 && roles.Count == 0)
                return _help.Warning("Åtkomst nekad! Behörighet saknas.");
          
            var groups = permissionGroups.OrderBy(x => x.Name).Select(s => new GroupModel
            {
                Name = s.Name,
                Manage = s.Manage
            }).ToList();

            var groupsNames = string.Join(",", groups.Select(s => s.Name));

            // If the logged user is found, create Jwt Token to get all other information and to get access to other functions
            var token = CreateJwtToken(user, string.Join(",", roles), model?.Password ?? "", groupsNames);

            // Your access has been confirmed.
            return new(new
            {
                token,
                groups
            });
        }
        catch (Exception ex)
        {
            // Activate a button in the user interface for sending an error message to the system developer if the same error is repeated more than two times during the same session
            return _help.Error("AuthenticationController: PostLogin", ex.Message);
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
            return new(new { errorMessage = ex.Message });
        }

        return new(true);
    }
    #endregion
    
    #region Helpers
    // Create Jwt Token for authenticating
    private string? CreateJwtToken(UserPrincipalExtension user, [FromBody] params string[] str)
    {
        if (user == null)
            return null;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);
        IdentityOptions opt = new();

        _session?.SetString("Password", str[1]);

        var roles = str[0].Split(",").ToList();
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user?.Name),
            new("Email", user.EmailAddress),
            new("DisplayName", user.DisplayName),
            new("Username", user.Name),
            new("Manager", user.Manager),
            new("Office", user.Office),
            new("Department", user.Department),
            new("Division", user.Division),
            new("Groups", str?[2] ?? ""),
            new("Roles", str?[0] ?? "")
        };

        if (roles.IndexOf("Support") > -1)
            claims.Add(new("Access", "access"));

        foreach (var role in roles)
            claims.Add(new Claim(opt.ClaimsIdentity.RoleClaimType, role));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([.. claims]),
            Expires = DateTime.Now.AddDays(3),
            SigningCredentials = credentials
        };

        var encodeToken = new JwtSecurityTokenHandler();
        var securityToken = encodeToken.CreateToken(tokenDescriptor);
        var token = encodeToken.WriteToken(securityToken);

        return token;
    }

    // Protection against account blocking after several unsuccessful attempts to authenticate
    public JsonResult? ProtectAccount(int attempt)
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

        return new(new { timeLeft = timeLeft.ToString("T") });
    }
    #endregion
}