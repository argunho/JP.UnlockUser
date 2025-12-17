using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using System.Security.Claims;
using System.Text;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthenticationController(IActiveDirectory provider, IConfiguration config, IHttpContextAccessor contextAccessor, IDistributedCache distributedCache, 
    IHelpService helpService, ICredentialsService credentials, ILocalUserService localService) : ControllerBase
{
    private readonly IActiveDirectory _provider = provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly IConfiguration _config = config; // Implementation of configuration file => ActiveDerictory/appsettings.json
    private readonly ISession? _session = contextAccessor?.HttpContext?.Session;
    private readonly IDistributedCache _distributedCache = distributedCache;
    private readonly IHelpService _helpService = helpService;
    private readonly ICredentialsService _credentials = credentials;
    private readonly ILocalUserService _localService = localService;


    private readonly string ctrl = nameof(AuthenticationController);

    #region POST   
    [HttpPost]
    public async Task<JsonResult> PostLogin([FromBody] LoginViewModel model)
    {
        // Forms filled out incorrectly
        if (!ModelState.IsValid)
            return new(_helpService.Warning());

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
                return new(_helpService.Warning($"Felaktig användarnamn eller lösenord. {4 - loginAttempt} försök kvar."));
            }

            _session?.Remove("LoginAttempt");
            _session?.Remove("LoginBlockTime");

            var permissionGroups = _config.GetSection("Groups").Get<List<GroupModel>>();
            var authorizedUser = _provider.FindUserByUsername(model!.Username!);
            var userGroups = _provider.GetUserGroups(authorizedUser);
            permissionGroups?.RemoveAll(x => !userGroups.Contains(x.PermissionGroup!));
            permissionGroups ??= [];
            List<string> roles = [];

            if (_provider.MembershipCheck(authorizedUser, "Azure-Utvecklare Test"))
                roles.Add("Developer");


            if (_provider.MembershipCheck(authorizedUser, "TEIS IT avdelning") || roles.Contains("Developer", StringComparer.OrdinalIgnoreCase))
                roles.Add("Support");

            // Failed! Permission missed
            if (permissionGroups.Count == 0 && roles.Count == 0)
                return new(_helpService.Warning("Åtkomst nekad! Behörighet saknas."));
          
            var passwordManageGroups = permissionGroups.OrderBy(x => x.Name).Select(s => new GroupModel
            {
                Name = s.Name,
                Group = s.Group
            }).ToList();

            //var userDataFromFile = _localService.GetUserFromFile(authorizedUser.Name!);
            var permissions = new PermissionsViewModel();


            List<Claim> claims = [];
            claims.Add(new("Email", authorizedUser.EmailAddress));
            claims.Add(new("DisplayName", authorizedUser.DisplayName));
            claims.Add(new("Username", authorizedUser.Name));
            claims.Add(new("Manager", authorizedUser.Manager));
            claims.Add(new("Permissions", JsonConvert.SerializeObject(permissions)));
            claims.Add(new("Office", authorizedUser.Office));
            claims.Add(new("Department", authorizedUser.Department));
            claims.Add(new("Division", authorizedUser.Division));
            claims.Add(new("PasswordManageGroups", JsonConvert.SerializeObject(passwordManageGroups)));
            claims.Add(new("Roles", string.Join(",", roles)));

            if (roles.IndexOf("Support") > -1)
                claims.Add(new("Access", "access"));

            _session?.SetString("HashedCredential", _helpService.EncodeToBase64($"{model.Password}{_config["JwtSettings:Key"]}"));

            // If the logged user is found, create Jwt Token to get all other information and to get access to other functions
            return new(_credentials.GenerateJwtToken(
                    claims,
                    _config["JwtSettings:Key"]!,
                    [.. roles.Distinct()],
                    false));
        }
        catch (Exception ex)
        {
            return new(await _helpService.Error($"{ctrl}: {nameof(PostLogin)}", ex));
        }
    }
    #endregion

    #region Delete
    [HttpDelete("logout")]
    public async Task<JsonResult> Logout()
    {
        try
        {
            var _session = HttpContext.Session;
            _session.Remove("HashedCredential");
            _session.Remove("LoginAttempt");
            _session.Remove("LoginBlockTime");

            var authHeader = HttpContext.Request.Headers.Authorization.ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                return new(_helpService.Warning("Token saknas"));

            var token = authHeader.Replace("Bearer ", "").Trim();

            var tokenKey = $"tokens:{token}:deactivated";
            await _distributedCache.SetStringAsync(tokenKey, " ", new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = DateTimeOffset.UtcNow
            });
        }
        catch (Exception ex)
        {
            return new(_helpService.Error($"{ctrl} {nameof(Logout)}", ex));
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