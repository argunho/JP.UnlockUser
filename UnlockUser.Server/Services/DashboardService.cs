using Google.Apis.Admin.Directory.directory_v1.Data;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Caching.Memory;

namespace UnlockUser.Server.Services;

public class DashboardService(
        IHttpContextAccessor contextAccessor,
        ILocalFileService localFileService,
        IConfiguration config,
        IADService provider,
        IMemoryCache memoryCache,
        IGoogleService googleService,
        ICredentialsService credentialsService,
        IRefreshLockService lockService,
        ILogger<DashboardService> logger
    )
{
    private readonly ISession? _session = contextAccessor.HttpContext!.Session;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IConfiguration _config = config;
    private readonly IADService _provider = provider;
    private readonly IMemoryCache _cache = memoryCache;
    private readonly IGoogleService _googleService = googleService;
    private readonly ICredentialsService _credentials = credentialsService;
    private readonly IRefreshLockService _lockService = lockService;
    private readonly ILogger<DashboardService> _logger = logger;


    public async Task StoreUsersByGroup(string? username = null, List<string>? sessionUserGroups = null, bool access = false)
    {
        _logger.LogInformation("Starting asynchronous dashboard data setup.");

        // Session users calims data
        if (string.IsNullOrEmpty(username))
        {
            var claims = _credentials.GetClaims(["username", "openAccess", "limitedAccess", "permissions"]);
            if (claims == null)
            {
                _logger.LogWarning("No claims available from credentials; aborting StoreUsersByGroup.");
                return;
            }
            claims.TryGetValue("username", out username);
            // start: 2026-09-24
            // OpenAccess/LimitedAccess claims hold "ok" (not a bool) and exist only when access is granted
            access = (claims.TryGetValue("openAccess", out string? openAccess) && !string.IsNullOrEmpty(openAccess))
                    || (claims.TryGetValue("limitedAccess", out string? limitedAccess) && !string.IsNullOrEmpty(limitedAccess));
            // end
            sessionUserGroups ??= claims!.TryGetValue("permissions", out string? permissions) ? [.. permissions.Split(',')] : [];
        }

        if (string.IsNullOrEmpty(username))
            return;

        if (_lockService.TryStart(username, out var waitTask))
        {
            try
            {
                // Employee groups where each group has its own password management permissions
                List<GroupModel> passwordManageGroups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];

                // Lopp of all employees groups
                foreach (var group in passwordManageGroups)
                {
                    // If the user is not a member of the support group and not a member of the current password management group, continue
                    if (!access && !sessionUserGroups!.Contains(group.Name, StringComparer.OrdinalIgnoreCase))
                        continue;

                    var (alternativeParams, isStudents) = await GetParams(group.Name!, username, access);


                    var cacheKey = (alternativeParams.Count > 0) ? $"{group.Name}:{username}" : $"{group.Name}".ToLower();
                    List<UserViewModel>? users = await _cache.GetOrCreateAsync(cacheKey, async entry =>
                    {
                        entry.SlidingExpiration = TimeSpan.FromHours(3); // Cache for 8 hours, removes after this time if it is not used
                        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(8); // Cache for 1 day, removes after this time even if it is used

                        if (isStudents)
                        {
                            var students = await _googleService.GetStudentsFromGoogleApi();
                            students ??= [];

                            if (alternativeParams.Count > 0)
                                _ = students.Where(x => alternativeParams!.Contains(x.Office!, StringComparer.OrdinalIgnoreCase));

                            return students!;
                        }

                        var employees = await _provider.GetUsersByGroupName(group, username, alternativeParams);

                        // Users model to view
                        var usersViewModel = employees?.Select(s => new UserViewModel(s)).ToList();
                        _ = usersViewModel?.ConvertAll(x => x.Group = group.Name).ToList();
                        _ = usersViewModel?.ConvertAll(x => x.PasswordLength = 12).ToList();

                        return usersViewModel;
                    });

                    _logger.LogInformation("Gruppdata har laddats ner. Group: {group}. Tid: {time}.", group.Name, DateTime.Now.ToString("G"));
                }

                var options = new MemoryCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromMinutes(15),
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
                };


                //_logger.LogInformation("Gruppdata har laddats ner. Group: {group}. Tid: {time}.", groups.Count, DateTime.Now.ToString("G")); ---???
                _logger.LogInformation("Dashboard data setup completed.");
            }
            catch (Exception ex)
            {
                _logger.LogError($"DashboardService. Failed to set up dashboard data. Error: {ex.Message}");
            }
            finally
            {
                _lockService.Finish(username);
            }
        }
    }

    public async Task<(List<string>, bool)> GetParams(string group, string username, bool access = false)
    {

        // Saved employees who have permission to manage employee passwords
        var moderators = await _localFileService.GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];

        // Currentsession user permissions
        var sessionUserPermissions = moderators.FirstOrDefault(x => x.Username == username)?.Permissions;

        // Parameters used to filter employees
        List<string>? alternativeParams = [];

        // Verify whether the current password management group is the student group
        bool isStudents = string.Equals(group, "Students", StringComparison.OrdinalIgnoreCase)
            || string.Equals(group, "studenter", StringComparison.OrdinalIgnoreCase);

        // If the user is not a member of the support group set limited params
        if (!access)
        {
            if (isStudents)
                alternativeParams = sessionUserPermissions!.Schools;
            else if (string.Equals(group, "Politiker", StringComparison.OrdinalIgnoreCase))
                alternativeParams = sessionUserPermissions!.Politicians;
            else
                alternativeParams = sessionUserPermissions!.Managers;
        }

        return (alternativeParams, isStudents);
    }

    public async Task<List<UserViewModel>> GetStoredUsersGroup(string group)
    {
        if(string.Equals(group.ToString(), "Overview", StringComparison.OrdinalIgnoreCase))
            return GetGroupsCachedUsers();

        var access = _credentials.GetClaim("openAccess") != null;
        var cacheKey = access ? group : $"{group}_{_credentials.GetClaim("username")}";

        if (_cache.TryGetValue(cacheKey, out List<UserViewModel>? cachedGroups))
            return cachedGroups ?? [];

        return [];
    }

    public List<UserViewModel> GetGroupsCachedUsers()
    {
        var groupModels = new List<UserViewModel>();

        List<string?> groups = [.. _config.
                   GetSection("Groups")
                   .Get<List<GroupModel>>()?
                   .Select(s => s.Name)!
                   .Where(x => !string.IsNullOrWhiteSpace(x))
                   .Cast<string>()!
         ];

        foreach (var group in groups)
        {
            if (_cache.TryGetValue(group,
                out List<UserViewModel>? cached))
            {
                groupModels.AddRange(cached);
            }
        }

        return groupModels;
    }

    public async Task UpdateApprovedEmployees(string username, List<ApprovedEmployeeViewModel> newApproved)
    {
        var lockKey = "approved-change";
        if (_lockService.TryStart(lockKey, out var waitTask))
        {
            try
            {
                var approved = await _localFileService.GetEncryptedFile<List<ApprovedEmployeeViewModel>>("catalogs/approved-employees") ?? [];
                if (approved.Count > 0)
                {
                    foreach (var emp in newApproved)
                    {
                        var existing = approved.FirstOrDefault(x => x.Username!.Equals(emp.Username, StringComparison.OrdinalIgnoreCase));
                        if (existing != null)
                        {
                            HashSet<string> moderators = [.. existing.Moderators!];
                            moderators!.Add(username);
                            existing.Moderators = [.. moderators];
                        }
                        else
                        {
                            approved.Add(emp);
                        }
                    }

                    var currentApproved = approved.Where(x => x.Moderators!.Contains(username, StringComparer.OrdinalIgnoreCase));
                    var currentApprovedToRemove = currentApproved.Where(x => !newApproved.Any(n => n.Username!.Equals(x.Username, StringComparison.OrdinalIgnoreCase))).ToList();
                    foreach(var emp in currentApprovedToRemove)
                    {
                        HashSet<string> moderators = [.. emp.Moderators!];
                        moderators.Remove(username);
                        emp.Moderators = [.. moderators];
                    }
                    currentApprovedToRemove.Where(x => x.Moderators!.Count == 0).ToList().ForEach(x => approved.Remove(x));
                }
                else
                    approved.AddRange(newApproved);

                await _localFileService.EncrypteToFile(approved, "catalogs/approved-employees");

            }
            catch (Exception ex)
            {
                _logger.LogError($"DashboardService. Failed to update approved-employees. Error: {ex.Message}");
                throw new Exception(ex.Message);
            }
            finally
            {
                _lockService.Finish(lockKey);
            }
        }
    }
}