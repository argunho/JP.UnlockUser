using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "DevelopTeam,ITGroup")]
public class PermissionsController(ILocalFileService localFileService, IHelpService helpService,
    IRefreshLockService lockService, ICredentialsService credentials,
    IMemoryCache memoryCache, ILogger<PermissionsController> logger) : ControllerBase
{
    private readonly IHelpService _help = helpService;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IRefreshLockService _lockService = lockService;
    private readonly ICredentialsService _credentials = credentials;
    private readonly IMemoryCache _cache = memoryCache;
    private readonly ILogger<PermissionsController> _logger = logger;

    private const string ModeratorsCatalog = "catalogs/moderators";

    #region POST
    [HttpPost("share")]
    public async Task<IActionResult> AddModeratorPermissions(PermissionFormModel request)
    {
        if (!ModelState.IsValid)
            return Ok(_help.Warning("Obligatoriska uppgifter saknas."));

        const string cacheKey = "share_permissions";
        if (_lockService.TryStart(cacheKey, out _))
        {
            try
            {
                var moderators = await _localFileService.GetEncryptedFile<List<UserViewModel>>(ModeratorsCatalog) ?? [];
                var moderator = moderators.FirstOrDefault(x => string.Equals(x.Username, request.Username, StringComparison.OrdinalIgnoreCase));
                if (moderator is null)
                    return NotFound(_help.NotFound("Anställd"));

                if (!string.Equals(request.Type, "Employees", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(request.Type, "Offices", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(_help.Warning("Ogiltig behörighetstyp."));

                moderator.Permissions ??= new PermissionsModel();
                if (string.Equals(request.Type, "Employees", StringComparison.OrdinalIgnoreCase))
                {
                    var employees = moderator.Permissions.Employees ?? [];
                    employees.AddRange(request.Permissions ?? []);
                    moderator.Permissions.Employees = [.. employees.Distinct()];
                }
                else
                {
                    var offices = moderator.Permissions.Offices ?? [];
                    offices.AddRange(request.Permissions ?? []);
                    moderator.Permissions.Offices = [.. offices.Distinct()];
                }

                await _localFileService.EncrypteToFile(moderators, ModeratorsCatalog);
                ChangeLog($"Moderators filen ändrad med delad behörigheter. Behörigheter: {request.Permissions} till {request.Username}.");
            }
            catch (Exception ex)
            {
                _logger.LogError("Critical problem. Function: {method}. Error: {error}", nameof(AddModeratorPermissions), ex.Message);
                return BadRequest(await _help.Error(ex));
            }
            finally
            {
                _lockService.Finish(cacheKey);
            }
        }
        return Ok();
    }
    #endregion

    #region PUT
    [HttpPut("update")]
    public async Task<IActionResult> PutModeratorsPermissions(CatalogsFormModel model)
    {
        string casheKey = "update_catalog";
        if (_lockService.TryStart(casheKey, out var waitTask))
        {
            try
            {
                _cache.Remove($"personal:{model.Username}");

                HashSet<string> changed = model.Names.ToHashSet(StringComparer.OrdinalIgnoreCase);

                if (changed.Contains("moderators"))
                {
                    var moderators = await _localFileService.GetEncryptedFile<List<UserViewModel>>(ModeratorsCatalog) ?? [];
                    var moderator = moderators.FirstOrDefault(x => x.Username == model.Username);
                    if (moderator == null)
                        return NotFound(_help.NotFound("Anställd"));

                    // Always overwrite with the client's current lists (not just when non-empty) - a
                    // "Count > 0" guard here can't tell "field untouched" apart from "cleared to empty",
                    // so clearing the last manager/politician/school could never actually be saved. — 2026-09-02 13:57
                    moderator.Permissions?.Managers = [.. model.Managers.OrderBy(x => x)];
                    moderator.Permissions?.Politicians = [.. model.Politicians.OrderBy(x => x)];
                    moderator.Permissions?.Schools = [.. model.Schools.OrderBy(x => x)];
                    moderator.Permissions?.Employees = [.. model.Employees.OrderBy(x => x)];
                    moderator.Permissions?.Offices = [.. model.Offices.OrderBy(x => x)];

                    await _localFileService.EncrypteToFile(moderators, ModeratorsCatalog);

                    ChangeLog($"Moderators filen ändrad med uppdaterad behörigheter. Updaterad: {moderator.Username}.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("Critical problem. Function: {method}. Error: {error}", nameof(PutModeratorsPermissions), ex.Message);
                return BadRequest(await _help.Error(ex));
            }
            finally
            {
                _lockService.Finish(casheKey);
            }
        }

        return Ok(_help.Success());
    }
    #endregion


    #region Private methods
    private void ChangeLog(string msg)
    {
        var username = _credentials.GetClaim("username");
        _logger.LogTrace($"{msg}. Användare: {0}", username);
    }
    #endregion
}
