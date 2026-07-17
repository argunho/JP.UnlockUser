using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

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
            var schools = (await _localFileService.GetListFromEncryptedFile<School>("catalogs/schools")).Select(s => new ViewModel
            {
                Id = s.Name,
                Primary = s.Name,
                Secondary = s.Place
            }) ?? [];
            var approvedEmployees = await _localFileService.GetListFromEncryptedFile<ApprovedEmployeeViewModel>($"catalogs/{ApprovedCatalog}") ?? [];
            var groups = _config.GetSection("Groups").Get<List<GroupModel>>()?.Select(s => s.Name).ToList();

            return Ok(new { moderators, managers, politicians, approvedEmployees, groups });
        }
        catch (Exception ex)
        {
            await _helpService.Error(ex);
            return Ok();
        }
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
    
    // Get schools list
    [HttpGet("schools")]
    public async Task<IActionResult> GetSchools()
    {
        var schools = (await _localFileService.GetListFromEncryptedFile<School>("catalogs/schools")).Select(s => new ViewModel
        {
            Id = s.Name,
            Primary = s.Name,
            Secondary = s.Place
        }).ToList() ?? [];

        return Ok( new { schools });
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
}
