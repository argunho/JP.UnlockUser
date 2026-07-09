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

            var schools = await GetSchoolsFromFile();
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

        return Ok(new { groupModels });
    }

    // Get schools list
    [HttpGet("schools")]
    public async Task<IActionResult> GetSchools()
    {
        var schools = await GetSchoolsFromFile();
        return Ok( new { schools });
    }

    // Get all history files
    [HttpGet("logs/history")]
    public async Task<IActionResult> GetTextFiles()
    {
        try
        {
            var histories = await _localFileService.GetListFromEncryptedFile<FileViewModel>("catalogs/histories");
            if (histories.Count == 0)
                return Ok();

            var historiesToView = histories?.OrderByDescending(x => x.Date).Select(s => new ViewModel
            {
                Id = s.Date!.Trim(),
                Primary = s.Name,
                Secondary = s.Date,
                Hidden = s.Description
            }).ToList();

            return Ok(historiesToView);
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex)); ;
        }
    }

    [HttpGet("logs/history/{id}")]
    public async Task<IActionResult> GetHistoryFileById(string id)
    {
        var histories = await _localFileService.GetListFromEncryptedFile<FileViewModel>("catalogs/histories");
        if (histories.Count == 0)
            return NotFound(_helpService.NotFound("Histork filen"));

        var history = histories.FirstOrDefault(x => x.Date!.Trim() == id.Trim());
        if (history == null)
            return NotFound(_helpService.NotFound("Histork filen"));

        return Ok(new ViewModel
        {
            Primary = history.Name,
            Secondary = history.Description
        });
    }

    // Get statistics
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        try
        {
            List<Statistics> data = await _localFileService.GetListFromEncryptedFile<Statistics>("catalogs/statistics");
            List<ViewModel> list = [.. data?.OrderBy(x => x.Year).Select(s => new ViewModel {
                Primary = s.Year.ToString(),
                Secondary = $"Byten lösenord: {s.Months.Sum(s => s.PasswordsChange)}, Upplåst konto: {s.Months.Sum(s => s.Unlocked)}",
                Values = [.. s.Months.OrderBy(o => o.Name).Select(s => new ViewModel {
                    Primary = s.Name,
                    Secondary = $"Byten lösenord: {s.PasswordsChange}, Upplåst konto: {s.Unlocked}"
                })]
            })!];

            int passwordChange = 0;
            int unlockedAccount = 0;
            foreach (var year in data)
            {
                foreach (var month in year.Months)
                {
                    passwordChange += month.PasswordsChange;
                    unlockedAccount += month.Unlocked;
                }
            }

            return Ok(new { list, secondaryLabel = $"Byten lösenord: {passwordChange}, Upplåst konto: {unlockedAccount}" });
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex)); ;
        }
    }

    // Download history file
    [HttpGet("history/download/by/{id}")]
    public async Task<IActionResult> DownloadFile(string id)
    {
        var items = await _localFileService.GetListFromEncryptedFile<FileViewModel>("catalogs/histories");
        if (items?.Count == 0)
            return BadRequest(_helpService.Warning("File hittades inte."));

        var item = items.FirstOrDefault(x => x.Date == id);
        if (item == null)
            return BadRequest(_helpService.Warning("File hittades inte."));

        byte[] downloadBytes = Encoding.UTF8.GetBytes(item.Download);
        return File(downloadBytes, "text/plain", $"History_{item?.Date}");
    }
    #endregion

    #region POST
    [HttpPost("school")]
    public async Task<IActionResult> PostSchool(School school)
    {
        try
        {
            var schools = await _localFileService.GetListFromEncryptedFile<School>("catalogs/schools");
            if (schools.Count == 0)
                schools = _localFileService.GetJsonFile<School>("schools");
            schools.Add(school);
            await Task.Delay(1000);

            await _localFileService.SaveUpdateEncryptedFile(schools, "catalogs/schools");

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex)); ;
        }
    }
    #endregion

    #region DELETE
    [HttpDelete("school/{name}")]
    public async Task<IActionResult> DeleteSchool(string name)
    {
        try
        {
            var schools = await _localFileService.GetListFromEncryptedFile<School>("catalogs/schools");
            schools = [.. schools.Where(x => !string.Equals(x.Name!.Trim(), name.Trim(), StringComparison.OrdinalIgnoreCase))];
            await Task.Delay(1000);
            await _localFileService.SaveUpdateEncryptedFile(schools, "catalogs/schools");
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex)); ;
        }
    }
    #endregion

    #region Help
    private async Task<List<ViewModel>> GetSchoolsFromFile()
    {
        var schools = (await _localFileService.GetListFromEncryptedFile<School>("catalogs/schools")).Select(s => new ViewModel
        {
            Id = s.Name,
            Primary = s.Name,
            Secondary = s.Place
        }).ToList() ?? [];

        return schools;
    }
    #endregion

    #region Obsolete
    #endregion
}
