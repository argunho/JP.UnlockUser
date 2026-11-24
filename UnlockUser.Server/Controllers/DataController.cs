using Google.Apis.Admin.Directory.directory_v1.Data;
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
                            IConfiguration config, IMemoryCache memoryCache, IRefreshLockService lockService,
                            DashboardService dashboardService, ILogger<DataController> logger) : ControllerBase
{
    private readonly IHelpService _helpService = helpService;
    private readonly ICredentialsService _credentials = credentials;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IConfiguration _config = config;
    private readonly IMemoryCache _cache = memoryCache;
    private readonly IRefreshLockService _lockService = lockService;
    private readonly DashboardService _dashboardService = dashboardService;

    private readonly ILogger<DataController> _logger = logger;

    #region GET
    [HttpGet("by/session")]
    public async Task<IActionResult> GetCollections()
    {
        try
        {
            // start: 2026-09-03
            // Return the cached JSON as-is instead of round-tripping
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

            claims.TryGetValue("username", out var username);

            // Verify the current user's membership in the support group 2026-08-28 15:28
            bool accessGroup = claims!.TryGetValue("openAccess", out string? openAccessValue) && !string.IsNullOrEmpty(openAccessValue);

            var moderators = await _localFileService.GetEncryptedFile<List<Models.User>>("catalogs/moderators");
            var mPermissions = moderators?.FirstOrDefault(x => x.Username != null && x.Username.Equals(username, StringComparison.OrdinalIgnoreCase))?.Permissions;

            var schoolsCatalog = await _localFileService.GetEncryptedFile<List<School>>("catalogs/schools") ?? [];
            var schools = (accessGroup ? schoolsCatalog : schoolsCatalog.Where(x => mPermissions!.Schools.Contains(x.Name, StringComparer.OrdinalIgnoreCase)))
                .Select(s => new ViewModel
                {
                    Id = s.Name,
                    Primary = s.Name,
                    Secondary = s.Place
                }).ToList() ?? [];

            data.Add("schools", schools);
            _logger.LogTrace("Gruppdata har laddats ner. Group: Skolor. Tid: {time}.", DateTime.Now.ToString("G"));


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

    [HttpGet("groups/by/{group}/{username}/{impersonating}")]
    public async Task<IActionResult> GetGroupsMembers(string group, string? username = null, bool impersonating = false)
    {
        try
        {
            // KC group has full access like a real KC login, so it uses the regular session cache path below (supports "overview")
            if (impersonating && !IsUserInRole("KCGroup")) // 2026-09-24
            {
                var users = await GetImpersonating(group, username);
                return Ok(users);
            }

            var members = await _dashboardService.GetStoredUsersGroup(group, username);
            return Ok(members);
        }
        catch (Exception ex)
        {
            await _helpService.Error(ex);
            return Ok();
        }
    }

    [HttpGet("groups/by/{group}")]
    public async Task<IActionResult> GetMembersByGroup(string group)
    {
        try
        {
            var members = await _dashboardService.GetStoredUsersGroup(group);
            var offices = members.Where(x => x.Office != null).Select(s => s.Office!.Trim()).Distinct().ToList();

            var catalog = await _localFileService.GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];
            var moderators = catalog.Where(x => x.Permissions != null && x.Permissions.Groups.Contains("personal", StringComparer.OrdinalIgnoreCase));
            return Ok(new { members, offices, moderators });
        }
        catch (Exception ex)
        {
            await _helpService.Error(ex);
            return Ok();
        }
    }

    // start: <date>
    // Lists what is stored in IMemoryCache: key, type and number of items (not the data itself)
    [HttpGet("cache/keys")]
    [Authorize(Roles = "DevelopTeam")]
    public IActionResult GetCacheKeys()
    {
        if (_cache is not MemoryCache memoryCache)
            return Ok(Array.Empty<object>());

        var entries = memoryCache.Keys
            .Select(key =>
            {
                memoryCache.TryGetValue(key, out object? value);
                return new
                {
                    Key = key.ToString(),
                    Type = value?.GetType().Name,
                    Count = value is System.Collections.ICollection collection ? collection.Count : (int?)null
                };
            })
            .OrderBy(x => x.Key)
            .ToList();

        return Ok(new { memoryCache.Count, statistics = memoryCache.GetCurrentStatistics(), entries });
    }
    // end
    #endregion

    #region POST
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

    [HttpPost("renew/stored")]
    public async Task<IActionResult> RenewStoredByUsername()
    {
        try
        {
            // start: 2026-11-24 10:30
            // If a refresh for this user is already running (e.g. right after login), wait for it first,
            // otherwise StoreUsersByGroup below would skip the work because of the lock
            var (username, _) = _dashboardService.GetClaimGroupUsername();
            if (!string.IsNullOrEmpty(username))
                await _lockService.GetWaitTask(username);

            // Schools/groups cached in the session are also built from the user's permissions
            HttpContext.Session.Remove("session-data");
            // end

            await _dashboardService.RemoveStoredByUsername();
            await _dashboardService.StoreUsersByGroup();
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError($"Endpoint: {nameof(RenewStoredByUsername)}. Error: {ex.Message}");
            return BadRequest(await _helpService.Error(ex)); // 2026-11-24 10:30 - don't send the exception text to the client
        }
    }

    [HttpPost("renew/stored/by/usernames")]
    [Authorize(Roles = "DevelopTeam")]
    public async Task<IActionResult> RenewStoredByUsernames(List<string> usernames, bool refresh = false)
    {
        try
        {
            var moderators = refresh ? await _localFileService.GetEncryptedFile<List<Models.User>>("catalogs/moderators") : [];
            foreach (var username in usernames)
            {
                if (!string.IsNullOrEmpty(username))
                    await _lockService.GetWaitTask(username);

                await _dashboardService.RemoveStoredByUsername(username);
                if (refresh)
                {
                    var moderator = moderators?.FirstOrDefault(x => x.Username != null && x.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
                    await _dashboardService.StoreUsersByGroup(username, moderator.Permissions.Groups);
                }
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError($"Endpoint: {nameof(RenewStoredByUsername)}. Error: {ex.Message}");
            return BadRequest(await _helpService.Error(ex)); // 2026-11-24 10:30 - don't send the exception text to the client
        }
    }
    #endregion

    #region Helpers
    private async Task<List<UserViewModel>> GetImpersonating(string group, string username)
    {
        List<UserViewModel> groupMembers = [];
        _cache.TryGetValue(group, out List<UserViewModel>? users);
        if (users == null)
            return [];

        var (alternativeParams, isStudents) = await _dashboardService.GetParams(group!, username!);
        if (isStudents)
        {
            users = [..users.Where(x => !string.IsNullOrEmpty(x.Office) &&
                                 alternativeParams.Any(p => x.Office!.StartsWith(p, StringComparison.OrdinalIgnoreCase)))];
        }
        else
        {
            var moderators = await _localFileService.GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];
            var permissions = moderators.FirstOrDefault(x => string.Equals(x.Username, username, StringComparison.OrdinalIgnoreCase))?.Permissions;
            var pe = permissions?.Employees ?? [];
            var po = permissions?.Offices ?? [];
            var mu = moderators.Select(m => m.Username).ToList();

            groupMembers.AddRange([.. users.Where(x =>
                    {
                        if (x.Manager == null || pe!.Contains(x.Username!) || po!.Contains(x.Office!) || mu.Contains(x.Username))
                            return false;

                        var m = x.Manager.Trim();

                        // ensure there's enough length for a start index of 3
                        if (m.Length <= 3)
                            return false;
                        var comma = m.IndexOf(',');

                        // ensure comma exists and is after the start index
                        if (comma <= 3)
                            return false;

                        var part = m[3..comma ];  // m.Substring(3, comma - 3)
                        return alternativeParams!.Contains(part, StringComparer.OrdinalIgnoreCase);
                    })]);

            var usernames = groupMembers.Select(s => s.Username).ToList();
            if (po?.Count > 0)
            {
                groupMembers.AddRange([.. users.Where(x => !usernames.Contains(x.Username!, StringComparer.OrdinalIgnoreCase)
                            && po.Contains(x.Office!, StringComparer.OrdinalIgnoreCase)
                            && !mu.Contains(x.Username, StringComparer.OrdinalIgnoreCase))]);
            }

            usernames = [.. groupMembers.Select(s => s.Username)];

            if (pe?.Count > 0)
            {
                groupMembers.AddRange([.. users.Where(x => !usernames.Contains(x.Username!, StringComparer.OrdinalIgnoreCase)
                            && pe.Contains(x.Username!, StringComparer.OrdinalIgnoreCase))]);
            }

            return groupMembers;
        }

        return users;
    }

    private bool IsUserInRole(string role)
    {
        var rolesClaim = _credentials.GetClaim("roles");
        if (string.IsNullOrEmpty(rolesClaim))
            return false;
        var roles = rolesClaim.Split(',').Select(s => s.Trim());
        return roles.Contains(role, StringComparer.OrdinalIgnoreCase);
    }
    #endregion
}