using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using System.Text;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DataController(IHelpService helpService, ICredentialsService credentials, ILocalFileService localFileService, 
                                        IConfiguration config, IMemoryCache memoryCache, IRefreshLockService lockService, ILogger<DataController> logger) : ControllerBase
{
    private readonly IHelpService _helpService = helpService;
    private readonly ICredentialsService _credentials = credentials;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IConfiguration _config = config;
    private readonly IMemoryCache _memoryCache = memoryCache;
    private readonly IRefreshLockService _lockService = lockService;

    private readonly ILogger<DataController> _logger = logger;

    #region GET
    [HttpGet("collections")]
    public async Task<IActionResult> GetCollections()
    {
        try
        {
            var cachedCollections = HttpContext.Session.GetString("collections");
            if (cachedCollections != null)
                return Ok(JsonConvert.DeserializeObject<Dictionary<string, object>>(cachedCollections));

            Dictionary<string, object>? collections = [];

            var claims = _credentials.GetClaims(["username", "openAccess", "permissions"]);

            // List of groups the current user are member
            List<string> sessionUserGroups = [.. claims!["permissions"].Split(',')]!;

            // Employee groups where each group has its own password management permissions
            List<GroupModel> passwordManageGroups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];

            var schools = (await _localFileService.GetListFromEncryptedFile<School>("catalogs/schools")).Select(s => new ViewModel
            {
                Id = s.Name,
                Primary = s.Name,
                Secondary = s.Place
            }).ToList() ?? []; 

            collections.Add("schools", schools);
            _logger.LogInformation("Gruppdata har laddats ner. Group: Skolor. Tid: {time}.", DateTime.Now.ToString("G"));

            // Verify the current user's membership in the support group
            bool accessGroup = !string.IsNullOrEmpty(claims["openAccess"]);

            if (accessGroup && passwordManageGroups.Count > 0)
                collections.Add("groups", passwordManageGroups.Select(s => s.Name).ToList());

            HttpContext.Session.SetString("collections", JsonConvert.SerializeObject(collections));

            return Ok(collections);
        }
        catch (Exception ex)
        {
            await _helpService.Error(ex);
        }

        return Ok();
    }

    [HttpGet("groups/by/name/{name}")]
    public async Task<IActionResult> GetGroupsByName(string name)
    {
        var groupModels = new List<UserViewModel>();
        var username = _credentials.GetClaim("username");

        bool isLoading = _lockService.IsLocked(username!);

        if (isLoading)
            await Task.WhenAny(_lockService.GetWaitTask(username!), Task.Delay(90000));

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

                groupModels = [.. groups.SelectMany(g => cachedGroups!.TryGetValue(g.ToLower(), out var value) ? value : [])];
            }
            else
            {
                groupModels = cachedGroups!.TryGetValue(name.ToLower(), out var value) ? value : [];
            }
        }

        return Ok(groupModels);
    }
    #endregion
}