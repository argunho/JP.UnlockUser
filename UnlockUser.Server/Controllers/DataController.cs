using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization; // 2026-09-03
using System.Text;
using System.Text.Json;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DataController(IHelpService helpService, ICredentialsService credentials, ILocalFileService localFileService,
                                        IConfiguration config, IMemoryCache memoryCache, IRefreshLockService lockService, IGoogleService googleService,
                                        DashboardService dashboardService, ILogger<DataController> logger) : ControllerBase
{
    private readonly IHelpService _helpService = helpService;
    private readonly ICredentialsService _credentials = credentials;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IConfiguration _config = config;
    private readonly IMemoryCache _memoryCache = memoryCache;
    private readonly IRefreshLockService _lockService = lockService;
    private readonly IGoogleService _googleService = googleService;
    private readonly DashboardService _dashboardService = dashboardService;

    private readonly ILogger<DataController> _logger = logger;

    #region GET
    [HttpGet("by/session")]
    public async Task<IActionResult> GetCollections()
    {
        try
        {
            // start: 2026-09-03
            // Return the cached JSON as-is instead of round-tripping it through
            // Dictionary<string, object> with Newtonsoft, which loses the camelCase
            // property names produced by the ASP.NET Core (System.Text.Json) pipeline
            // used on the first request and broke AutocompleteList's option?.primary lookup.
            var sessionData = HttpContext.Session.GetString("session-data");
            if (sessionData != null)
                return Content(sessionData, "application/json");
            // end

            Dictionary<string, object>? data = [];

            var claims = _credentials.GetClaims(["username", "openAccess", "permissions"]);

            // List of groups the current user are member
            List<string> sessionUserGroups = [.. claims!["permissions"].Split(',')]!;

            // Employee groups where each group has its own password management permissions
            List<GroupModel> groups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];

            var schools = (await _localFileService.GetEncryptedFile<List<School>>("catalogs/schools"))?.Select(s => new ViewModel
            {
                Id = s.Name,
                Primary = s.Name,
                Secondary = s.Place
            }).ToList() ?? [];

            data.Add("schools", schools);
            _logger.LogInformation("Gruppdata har laddats ner. Group: Skolor. Tid: {time}.", DateTime.Now.ToString("G"));

            // Verify the current user's membership in the support group
            // "openAccess" claim is only present on the token when true (see AuthenticationController) — 2026-08-28 15:28
            bool accessGroup = claims!.TryGetValue("openAccess", out string? openAccessValue) && !string.IsNullOrEmpty(openAccessValue);

            if (accessGroup && groups.Count > 0)
                data.Add("groups", groups.Select(s => s.Name).ToList());

            // start: 2026-09-03
            // Serialize with a camelCase resolver so the cached string matches the
            // camelCase shape the client receives from Ok(data) on the first request.
            HttpContext.Session.SetString("session-data", JsonConvert.SerializeObject(data, new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            }));
            // end

            return Ok(data);
        }
        catch (Exception ex)
        {
            await _helpService.Error(ex);
        }

        return Ok();
    }

    [HttpGet("groups/by/{name}")]
    public async Task<IActionResult> GetGroupsByName(string name)
    {
        var username = _credentials.GetClaim("username");

        bool isLoading = _lockService.IsLocked(username!);

        if (isLoading)
            await Task.WhenAny(_lockService.GetWaitTask(username!), Task.Delay(90000));

        var group_members = GetCachedUsersGroup(name);
        if (group_members.Count > 0)
            return Ok(group_members);

        if (_lockService.TryStart(username!, out var waitTask))
        {
            try
            {
                var claim_roles = _credentials.GetClaim("roles");
                var roles = claim_roles?.Split(',', StringSplitOptions.RemoveEmptyEntries);
                bool openAccess = roles.Contains("Moderator", StringComparer.OrdinalIgnoreCase);

                await _dashboardService.StoreUsersByGroup(username!, openAccess, [name]);

                group_members = GetCachedUsersGroup(name);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to set up dashboard data. Error: {ex.Message}");
            }
            finally
            {
                _lockService.Finish(username!);
            }
        }

        return Ok(group_members);
    }
    #endregion

    #region POST
    [HttpPost("update/stored")]
    public async Task<IActionResult> UpdateStoredData()
    {
        var claims = _credentials.GetClaims(["username", "openAccess", "permissions"]);

        claims!.TryGetValue("username", out string? username);
        // Get users by groups 
        _ = Task.Run(async () =>
        {
            if (_lockService.TryStart(username!, out var waitTask))
            {
                bool openAccess = claims!.TryGetValue("openAccess", out string? access) && bool.Parse(access);
                List<string> groups = claims!.TryGetValue("permissions", out string? permissions) ? [.. permissions.Split(',')] : [];

                try
                {
                    _logger.LogInformation("Starting asynchronous dashboard data setup.");
                    await _dashboardService.StoreUsersByGroup(username!, openAccess, groups!);
                    _logger.LogInformation("Dashboard data setup completed.");
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Failed to set up dashboard data. Error: {ex.Message}");
                }
                finally
                {
                    _lockService.Finish(username!);
                }
            }
        });

        return Ok();
    }


    /// <summary>
    /// Upload google service json, customer id and customer email
    /// </summary>
    /// <param name="file"></param>
    /// <param name="data"></param>
    /// <returns></returns>
    [HttpPost("upload/service/file")]
    [Authorize(Roles = "Moderator, DevelopTeam")]
    public async Task<IActionResult> UploadGoogleAccountData([FromForm] IFormFile file, [FromForm] string data)
    {
        try
        {
            if (file == null || file.Length == 0)
                return Ok(_helpService.Warning("Filen saknas."));

            data = Uri.UnescapeDataString(data);
            ServiceModel? model = System.Text.Json.JsonSerializer.Deserialize<ServiceModel>(
                data,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            // Read uploaded file content (the JSON) and save its content encrypted
            using var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8);
            var fileContent = await reader.ReadToEndAsync();
            await _localFileService.EncrypteToFile(fileContent, "services/service");
            await _localFileService.EncrypteToFile(model, "services/config");
        }
        catch (Exception ex)
        {
            _logger.LogError($"{nameof(UploadGoogleAccountData)} error: {ex.Message}");
            await _helpService.Error(ex);
        }

        return Ok();
    }
    #endregion

    #region Private methods
    private List<UserViewModel> GetCachedUsersGroup(string name)
    {
        var group_members = new List<UserViewModel>();
        var id = HttpContext.Session.Id;
        if (_memoryCache.TryGetValue(
            $"groups_{id}",
            out Dictionary<string, List<UserViewModel>>? cachedGroups))
        {
            bool supportModel = string.Equals(name.ToString(), "Support", StringComparison.OrdinalIgnoreCase);
            if (supportModel)
            {
                List<string?> groups = [.. _config.
                   GetSection("Groups")
                   .Get<List<GroupModel>>()?
                   .Select(s => s.Name)!
                   .Where(x => !string.IsNullOrWhiteSpace(x))
                   .Cast<string>()!
                 ];

                group_members = [.. groups.SelectMany(g => cachedGroups!.TryGetValue(g.ToLower(), out var value) ? value : [])];
            }
            else
            {
                group_members = cachedGroups!.TryGetValue(name.ToLower(), out var value) ? value : [];
            }
        }

        return group_members;
    }
    #endregion
}

//[HttpGet("students")]
//[AllowAnonymous]
//public async Task<IActionResult> GetStudents([FromQuery] string? date)
//{
//    DateTime currentDate = DateTime.Now;
//    if (date == null || Convert.ToDateTime(date).Date != currentDate.Date)
//        return Ok();

//    var users = await _googleService.GetStudentsFromGoogle();
//    return Ok(users);
//}

//[HttpGet("users")]
//[AllowAnonymous]
//public async Task<IActionResult> GetUsers([FromQuery] string? date)
//{
//    DateTime currentDate = DateTime.Now;
//    if (date == null || Convert.ToDateTime(date).Date != currentDate.Date)
//        return Ok();

//    var users = await _googleService.GetUsers();
//    return Ok(users);
//}

//[HttpGet("user/by")]
//[AllowAnonymous]
//public async Task<IActionResult> GetUser([FromQuery] string email, [FromQuery] string? date)
//{
//    DateTime currentDate = DateTime.Now;
//    if (date == null || Convert.ToDateTime(date).Date != currentDate.Date)
//        return Ok();

//    var user = await _googleService.GetUser(email);
//    return Ok(user);
//}

//[HttpPost("change/password")]
//[AllowAnonymous]
//public async Task<IActionResult> ChangePassword(UserFormModel model)
//{
//    try
//    {
//        await _googleService.UpdatePaswords([model]);
//    }catch(Exception ex)
//    {
//        Console.WriteLine(ex.Message);
//    }

//    return Ok();
//}