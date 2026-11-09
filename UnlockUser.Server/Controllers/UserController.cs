using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.DirectoryServices;
using System.Globalization;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Moderator,ITGroup,DevelopTeam,KCGroup")]
public class UserController(IADService provider, IConfiguration config, ILocalFileService localFileService, 
    IHelpService helpService, ILocalUserService localUserService, IMemoryCache memoryCahce,
    ICredentialsService credinalService, DashboardService dashboard, ILogger<UserController> logger) : ControllerBase
{
    private readonly IADService _provider = provider;
    private readonly IConfiguration _config = config;
    private readonly IHelpService _help = helpService;
    private readonly ILocalFileService _localFile = localFileService;
    private readonly IMemoryCache _cache = memoryCahce;
    private readonly ILocalUserService _localUser = localUserService;
    private readonly ICredentialsService _credentials = credinalService;
    private readonly DashboardService _dashboard = dashboard;
    private readonly ILogger<UserController> _logger = logger;

    #region GET
    // Get user information by username
    [HttpGet("by/{group}/{key}")]
    public async Task<IActionResult> GetUserForPasswordManage(string group, string key)
    {
        try
        {
            _ = group.ToLower();

            UserViewModel? user = null;

            if (_cache.TryGetValue($"{group}", out List<UserViewModel>? cached)
                && _credentials.GetClaimValue<bool>("openAccess", "bool"))
            {
                user = cached?.FirstOrDefault(x => x.Username == key)
                          ?? cached?.FirstOrDefault(x => x.Email == key);

                user.IsLocked = _provider.UserIsLocked(user.Username);
                return Ok(user);
            }
            else if (_cache.TryGetValue($"{group}:{_credentials.GetClaim("username")}", out cached))
            {
                user = cached?.FirstOrDefault(x => x.Username == key)
                                ?? cached?.FirstOrDefault(x => x.Email == key);
                user.IsLocked = _provider.UserIsLocked(user.Username);
                return Ok(user);
            }


            // Search in AD
            var groupName = "Employees";
            DirectorySearcher? members = _provider.GetMembers(groupName);

            members.Filter = $"(&(objectClass=User)(|(cn={key})(sAMAccountname={key})))";

            var claims = _credentials.GetClaims(["roles", "permissions"]);

            if (members.FindOne() != null)
            {
                user = new UserViewModel((_provider.GetUsers(members, group)).FirstOrDefault()!);
                if ((user == null))
                {
                    return NotFound(_help.NotFound("Användaren"));
                }
                else if (!claims!["roles"].Contains("Suppport", StringComparison.OrdinalIgnoreCase)
                        && ((await _localUser.Filter([user], groupName, claims!["permissions"]))?.Count == 0))
                {
                    return Ok(_help.Warning($"Behörigheter saknas att ändra lösenord till {user.DisplayName}!"));
                }

                if (_provider.MembershipCheck(_provider.FindUser(key), "Password Twelve Characters"))
                    user!.PasswordLength = 12;
            }
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }

    [HttpGet("saved/{username}")]
    [Authorize(Roles = "ITGroup,DevelopTeam")]
    public async Task<IActionResult> GetCachedUser(string username)
    {
        try
        {
            var user = await _localUser.GetUserFromFile(username);
            if (user != null)
                return Ok(new UserViewModel(user));

            return NotFound(_help.NotFound("Användaren"));
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }

    [HttpGet("by/{key}")]
    [HttpGet("by/{key}/search/{search:bool}")]
    [Authorize(Roles = "ITGroup,DevelopTeam,KCGroup,Moderator")]
    public async Task<IActionResult> GetUserByUsername(string key, bool search = false)
    {
        try
        {
            var collections = _dashboard.GetGroupsCachedUsers();
            if (collections.Count > 0)
            {
                var user = collections.FirstOrDefault(x => x.Username == key)
                                ?? collections.FirstOrDefault(x => x.Email == key);
                if (user != null)
                {
                    if (user.Permissions?.Groups.Count == 0 || search)
                        collections = [];

                    if (!search)
                    {
                        List<ViewModel?>? moderators = [.. (await _localFile.GetEncryptedFile<List<Models.User>>("catalogs/moderators") ?? [])
                                .Where(x => !string.Equals(x.Username, user!.Username, StringComparison.OrdinalIgnoreCase)
                                            && x != null && x.Manager != null && string.Equals(x.Manager, user?.Manager, StringComparison.OrdinalIgnoreCase)
                                            && x.Permissions != null && x.Permissions.Groups.Contains(user?.Group, StringComparer.OrdinalIgnoreCase))
                         .Select(s => new ViewModel
                         {
                             Id = s.Username,
                             Primary = s.DisplayName,
                             Secondary = $"{s.Office} > {(s.Department == s.Office ? s.Division : s.Department)}"
                         }) ?? []]; ;

                        bool isLocked = _provider.UserIsLocked(user.Username);

                        return Ok(new { user, moderators, collections, isLocked });
                    }

                    return Ok(user);
                }
            }

            var userPrincipal = _provider.FindUser(key);
            if (userPrincipal == null)
                return NotFound(_help.NotFound("Användaren"));

            var cachedUser = await _localUser.GetUserFromFile(key);
            var modifiedUser = new UserViewModel(new Models.User
            {
                Username = userPrincipal.SamAccountName,
                DisplayName = userPrincipal.DisplayName,
                Title = userPrincipal.Title,
                Email = userPrincipal.EmailAddress,
                Office = userPrincipal.Office,
                Department = userPrincipal.Department,
                Division = userPrincipal.Division,
                Manager = userPrincipal.Manager,
                IsLocked = userPrincipal.AccountLockoutTime != null,
                Permissions = cachedUser != null ? cachedUser?.Permissions : null
            });

            if (userPrincipal.DistinguishedName!.Contains("OU=Employees", StringComparison.OrdinalIgnoreCase))
            {
                var userByGroups = _provider.GetSecurityGroupMembers("Ciceron-Assistentanvändare");
                if (userByGroups != null && userByGroups.FirstOrDefault(x => x == userPrincipal.SamAccountName) != null)
                    modifiedUser.Group = "Politeker";
                else
                    modifiedUser.Group = "Personal";
            }
            else
                modifiedUser.Group = "Stundeter";

            return Ok(new { user = modifiedUser, collections });
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }

    [HttpGet("groups")]
    [Authorize(Roles = "DevelopTeam,ITGroup")]
    public List<string?> GetGroups()
    {
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];
        if (groups.Count > 0)
            return [.. groups.Select(x => x.Name)];

        return [];
    }

    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions()
    {
        try
        {
            List<SchoolViewModel> schools = [];
            List<ViewModel> managers = [];
            var username = _credentials.GetClaim("username");
            var user = await _localUser.GetUserFromFile(username!);
            if (user == null)
                return Ok(new { schools, managers });

            schools = [.. (await _localFile.GetEncryptedFile<List<SchoolViewModel>>("catalogs/schools"))?
                         .Where(x => (bool)(user.Permissions?.Schools.Contains(x.Name, StringComparer.OrdinalIgnoreCase))!) ?? []];

            var managersNames = user.Permissions?.Managers;
            managers = [.. (await _localFile.GetEncryptedFile<List<Manager>>("catalogs/managers"))
                                .Where(x => managersNames!.Contains(x.Username, StringComparer.OrdinalIgnoreCase))
                         .Select(s => new ViewModel
                         {
                             Id = s.Username,
                             Primary = s.Office,
                             Secondary = s.Department == s.Office ? s.Division : s.Department
                         }) ?? []];


            var moderators = await _localFile.GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];
            var permissions = moderators.FirstOrDefault(x => string.Equals(x.Username, username, StringComparison.OrdinalIgnoreCase))?.Permissions;
            var offices = permissions?.Offices.Select(s => new ViewModel
            {
                Id = s,
                Primary = s
            }) ?? [];

            return Ok(new { groups = user.Permissions?.Groups, schools, managers, offices });
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }
    #endregion

    #region PUT
    [HttpPut("unlock/{username}")] // Unlock user
    [Authorize(Roles = "DevelopTeam,Moderator,ITGroup")]
    [Authorize(Policy = "NotImpersonating")]
    public async Task<IActionResult> UnlockUser(string username)
    {
        try
        {
            var message = _provider.UnlockUser(username);
            if (message.Length > 0)
                return Ok(_help.Warning(message));

            // Save/Update statistics
            await SaveUpdateStatistics("Unlocked", 1);

            return Ok(new { success = true, color = "success", msg = "Användaren har låsts upp!" });
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }
    #endregion

    #region Helpers
    // Save update statistik
    private async Task SaveUpdateStatistics(string param, int count)
    {
        try
        {
            var year = DateTime.Now.Year;
            var month = DateTime.Now.ToString("MMMM", CultureInfo.InvariantCulture);

            var passChange = (param == "PasswordsChange");

            var statistics = await _localFile.GetEncryptedFile<List<Statistics>>("catalogs/statistics") ?? [];
            var yearStatistics = statistics.FirstOrDefault(x => x.Year == year);

            var newData = new Months
            {
                Name = month,
                PasswordsChange = passChange ? count : 0,
                Unlocked = passChange ? 0 : count
            };

            if (yearStatistics != null)
            {
                var monthStatistics = yearStatistics.Months.FirstOrDefault(x => x.Name == month);
                if (monthStatistics != null)
                {
                    if (passChange)
                        monthStatistics.PasswordsChange += count;
                    else
                        monthStatistics.Unlocked += count;
                }
                else
                    yearStatistics.Months.Add(newData);
            }
            else
            {
                statistics.Add(new Statistics
                {
                    Year = year,
                    Months = [newData]
                });
            }

            await _localFile.EncrypteToFile(statistics, "catalogs/statistics");
        }
        catch (Exception ex)
        {
            _logger.LogError("Unable to save the statistics file! Error: {error}", ex.Message);
            await _help.Error(ex);
        }
    }
    #endregion
}