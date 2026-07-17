using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Text;

namespace UnlockUser.Server.Controllers;

[Route("api/catalog")]
[Route("api/catalogs")]
[ApiController]
[Authorize(Roles = "DevelopTeam,Manager,Moderator")]
public class CatalogController(ILocalFileService localFileService, IHelpService helpService,
    IConfiguration config, ILocalUserService localUserService,
    ILogger<CatalogController> logger) : ControllerBase
{
    private readonly IConfiguration _config = config;
    private readonly IHelpService _helpService = helpService;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly ILocalUserService _localUserService = localUserService;
    private readonly ILogger<CatalogController> _logger = logger;

    private const string ModeratorsCatalog = "moderators";
    private const string ApprovedCatalog = "approved-employees";


    #region GET
    // Get stored  employees who have permission to manage employee passwords nby group name
    [HttpGet]
    public async Task<IActionResult> GetUsersByGroupName()
    {
        try
        {
            // Saved employees who have permission to manage employee passwords
            var moderators = await _localFileService.GetListFromEncryptedFile<UserViewModel>($"catalogs/{ModeratorsCatalog}") ?? [];
            var managers = await _localFileService.GetListFromEncryptedFile<Manager>("catalogs/managers") ?? [];
            var politicians = (await _localFileService.GetListFromEncryptedFile<User>("catalogs/politicians")).Select(s => new UserViewModel(s)) ?? [];
            var approvedEmployees = await _localFileService.GetListFromEncryptedFile<ApprovedEmployeeViewModel>($"catalogs/{ApprovedCatalog}") ?? [];
            var groups = _config.GetSection("Groups").Get<List<GroupModel>>()?.Select(s => s.Name).ToList();
            var schools = await SchoolsFromFile();

            return Ok(new { moderators, managers, politicians, schools, approvedEmployees, groups });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Something went wrong with attempt to get catalog files. Error: {ex.Message}");
            await _helpService.Error(ex);
            return Ok();
        }
    }

    // Get schools
    [HttpGet("schools")]
    public async Task<IActionResult> GetSchools()
    {
        var schools = await SchoolsFromFile();
        return Ok(schools);
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
    
    // Get all logs history files
    [HttpGet("histories")]
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

    // Download history log file by id
    [HttpGet("history/{id}")]
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
    [HttpPost("renew/saved")]
    public async Task<IActionResult> RenewSavedEmployeesList()
    {
        try
        {
            await _localUserService.RenewUsersCachedList();
            _localFileService.UpdateConfigFile("appconfig", "LastUpdatedDate", DateTime.Now.ToString("yyyy.MM.dd HH:mm:ss"));
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }    

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

            await _localFileService.SaveUpdateEncryptedFile(schools, "catalogs", "schools");

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex)); ;
        }
    }
    #endregion

    #region PUT
    [HttpPut("update/changed")]
    public async Task<IActionResult> PutChanged(CatalogsFormModel model)
    {
        try
        {
            HashSet<string> changed = model.Names.ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (changed.Contains(ModeratorsCatalog))
            {
                var moderators = await _localFileService.GetListFromEncryptedFile<UserViewModel>($"catalogs/{ModeratorsCatalog}") ?? [];
                var moderator = moderators.FirstOrDefault(x => x.Username == model.Username);
                if (moderator == null)
                    return NotFound(_helpService.NotFound("Anställd"));


                if (model.Managers.Count > 0)
                    moderator.Permissions?.Managers = [.. model.Managers.OrderBy(x => x)];
                if (model.Politicians.Count > 0)
                    moderator.Permissions?.Politicians = [.. model.Politicians.OrderBy(x => x)];
                if (model.Schools.Count > 0)
                    moderator.Permissions?.Schools = [.. model.Schools.OrderBy(x => x)];

                await _localFileService.SaveUpdateEncryptedFile(moderators, "catalogs", ModeratorsCatalog);
            }

            if (changed.Contains(ApprovedCatalog))
            {
                await _localFileService.SaveUpdateEncryptedFile(model.ApprovedEmployees, "catalogs", ApprovedCatalog);
            }
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }

        return Ok(_helpService.Success());
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
            await _localFileService.SaveUpdateEncryptedFile(schools, "catalogs", "schools");
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex)); ;
        }
    }
    #endregion

    #region Private methods
    public async Task<List<ViewModel>> SchoolsFromFile()
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
}
