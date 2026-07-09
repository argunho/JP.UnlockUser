using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using System.Security.Claims;
using System.Text;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthenticationController(IActiveDirectory provider, IConfiguration config, IHttpContextAccessor contextAccessor, IDistributedCache distributedCache,
    IHelpService helpService, ICredentialsService credentials, ILocalFileService localFileService, IRefreshLockService lockService, IMemoryCache memoryCache, DashboardService dashboardService, ILogger<AuthenticationController> logger) : ControllerBase
{
    private readonly IActiveDirectory _provider = provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly IConfiguration _config = config; // Implementation of configuration file => ActiveDerictory/appsettings.json
    private readonly ISession? _session = contextAccessor.HttpContext!.Session;
    private readonly IDistributedCache _distributedCache = distributedCache;
    private readonly IHelpService _helpService = helpService;
    private readonly ICredentialsService _credentials = credentials;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IRefreshLockService _lockService = lockService;
    private readonly IMemoryCache _memoryCache = memoryCache;
    private readonly DashboardService _dashboardService = dashboardService;
    private readonly ILogger<AuthenticationController> _logger = logger;


    #region POST   
    [HttpPost]
    public async Task<IActionResult> PostLogin([FromBody] LoginViewModel model)
    {
        // Forms filled out incorrectly
        if (!ModelState.IsValid)
            return Ok(_helpService.Warning());

        try
        {
            int loginAttempt = _session?.GetInt32("LoginAttempt") ?? 0;
            var timeLeft = ProtectAccount(loginAttempt);
            if (!string.IsNullOrEmpty(timeLeft))
                return Ok(new { timeLeft });

            // Validate username and password
            var isAutheticated = _provider.AccessValidation(model?.Username, model?.Password);

            //Incorrect username or password
            if (!isAutheticated)
            {
                // If the user tried to put in a wrong password, save this like +1 a wrong attempt and the max is 4 attempts
                _session?.SetInt32("LoginAttempt", loginAttempt += 1);
                _logger.LogWarning("Varning: Försök att logga in med fel användarnamn eller lösenord. Användarnamn: {username}. Tid: {time}", model!.Username, DateTime.Now.ToString("g"));
                return Ok(_helpService.Warning($"Felaktig användarnamn eller lösenord. {4 - loginAttempt} försök kvar."));
            }

            _session?.Remove("LoginAttempt");
            _session?.Remove("LoginBlockTime");

            var permissionGroups = _config.GetSection("Groups").Get<List<GroupModel>>();
            var groups = string.Join(",", permissionGroups!.Select(x => x.Name));

            var authorizedUser = _provider.FindUserByUsername(model!.Username!);
            if (authorizedUser == null)
                return NotFound(_helpService.NotFound("Användaren"));

            List<string> roles = [];
            if (_provider.MembershipCheck(authorizedUser, "Azure-Utvecklare Test"))
                roles.Add("DevelopTeam");

            if (_provider.MembershipCheck(authorizedUser, "TEIS IT avdelning")
                    || roles.Contains("DevelopTeam", StringComparer.OrdinalIgnoreCase))
                roles.Add("Moderator");

            var userGroups = _provider.GetUserGroups(authorizedUser);
            permissionGroups?.RemoveAll(x => !userGroups.Contains(x.PermissionGroup!));
            permissionGroups ??= [];

            // Failed! Permission missed
            if (permissionGroups.Count == 0 && roles.Count == 0)
                return Ok(_helpService.Warning("Åtkomst nekad! Behörighet saknas."));

            var moderators = await _localFileService.GetListFromEncryptedFile<User>("catalogs/moderators");
            var currentModerator = moderators.FirstOrDefault(x => x.Username != null && x.Username.Equals(authorizedUser.Name!, StringComparison.OrdinalIgnoreCase));
            if (currentModerator != null)
                _session!.SetString("permissions", JsonConvert.SerializeObject(currentModerator?.Permissions));


            //var userModel = new 
            List<Claim> claims = [];
            claims.Add(new("Email", authorizedUser.EmailAddress));
            claims.Add(new("DisplayName", authorizedUser.DisplayName));
            claims.Add(new("Username", authorizedUser.Name!));
            claims.Add(new("Manager", authorizedUser.Manager));
            claims.Add(new("Office", authorizedUser.Office));
            claims.Add(new("Department", authorizedUser.Department));
            //claims.Add(new("User", JsonConvert.SerializeObject(authorizedUser)));
            claims.Add(new("Groups", groups));
            claims.Add(new("Permissions", string.Join(',', currentModerator?.Permissions?.Groups ?? [])));
            claims.Add(new("Roles", string.Join(",", roles)));

            bool openAccess = roles.IndexOf("Moderator") > -1;
            if (openAccess)
                claims.Add(new("OpenAccess", "ok")); //

            // Save hashed credentials in session to validate user on other requests
            if (_session != null)
            {
                byte[] protectedPassword = DpapiProtector.Protect(model.Password);
                _session.Set("adminPassword", protectedPassword);
                _session.SetString("adminUsername", model.Username);
            }

            _logger.LogInformation("Autentisering utförd vid: {time}. Department: {department}. Office: {office}.", DateTime.Now.ToString("g"), authorizedUser.Department, authorizedUser.Office);

            var jwtToken = JsonConvert.SerializeObject(_credentials.GenerateJwtToken(
                    claims,
                    _config["JwtSettings:Key"]!,
                    [.. roles.Distinct()],
                    false)
                );

            var authModel = JsonConvert.DeserializeObject<AuthViewModel>(jwtToken);

            authModel.GroupName = (permissionGroups?.FirstOrDefault()?.Name ?? "Support").ToLower();

            // Get users by groups 
            _ = Task.Run(async () =>
            {
                if (_lockService.TryStart(model.Username, out var waitTask))
                {
                    try
                    {
                        _logger.LogInformation("Starting asynchronous dashboard data setup.");
                        await _dashboardService.StoreUsersByGroup(model.Username, openAccess, currentModerator?.Permissions?.Groups!);
                        _logger.LogInformation("Dashboard data setup completed.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Failed to set up dashboard data. Error: {ex.Message}");
                    }
                    finally
                    {
                        _lockService.Finish(model.Username);
                    }
                }
            });

            // If the logged user is found, create Jwt Token to get all other information and to get access to other functions
            return Ok(authModel);
        }
        catch (Exception ex)
        {
            _logger.LogError("Autentisering misslyckades. Fel: {error}", ex.Message);
            return BadRequest(await _helpService.Error(ex));
        }
    }
    #endregion

    #region Delete
    [HttpDelete("logout")]
    public async Task<IActionResult> Logout()
    {
        try
        {
            var _session = HttpContext.Session;
            _session.Remove("HashedCredential");
            _session.Remove("LoginAttempt");
            _session.Remove("LoginBlockTime");
            _session.Remove("collection");
            _session.Remove("adminPassword");
            _session.Remove("adminUsername");
            _session.Remove("permisions");

            var authHeader = HttpContext.Request.Headers.Authorization.ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                return Ok(_helpService.Warning("Token saknas"));

            var token = authHeader.Replace("Bearer ", "").Trim();

            var tokenKey = $"tokens:{token}:deactivated";
            await _distributedCache.SetStringAsync(tokenKey, " ", new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = DateTimeOffset.UtcNow
            });

            _memoryCache.Remove($"groups_{_session.Id}");
            _session.Clear();
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }

        return Ok();
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