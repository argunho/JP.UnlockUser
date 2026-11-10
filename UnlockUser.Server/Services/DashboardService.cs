using Google.Apis.Admin.Directory.directory_v1.Data;
using Microsoft.Extensions.Caching.Memory;

namespace UnlockUser.Server.Services;

public class DashboardService(
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
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IConfiguration _config = config;
    private readonly IADService _provider = provider;
    private readonly IMemoryCache _cache = memoryCache;
    private readonly IGoogleService _googleService = googleService;
    private readonly ICredentialsService _credentials = credentialsService;
    private readonly IRefreshLockService _lockService = lockService;
    private readonly ILogger<DashboardService> _logger = logger;

    public async Task CacheUsersByGroup()
    {
        try
        {
            var students = await _googleService.GetStudentsFromGoogleApi() ?? [];
            if (students.Count > 0)
            {
                var cacheKey = "studenter";
                _cache.Set(cacheKey, students, new MemoryCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromHours(15), // Cache for 15 hours, removes after this time if it is not used
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(18) // Cache for 18 hours, removes after this time even if it is used
                });
            }

            var employeesByGroup = await _provider.GetEmployesByGroupName();
            foreach (var (group, employees) in employeesByGroup)
            {
                var cacheKey = group.ToLowerInvariant();
                var users = employees
                    .Select(employee => new UserViewModel(employee)
                    {
                        Group = group,
                        PasswordLength = 12
                    })
                    .ToList();

                _cache.Set(cacheKey, users, new MemoryCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromHours(15), // Cache for 15 hours, removes after this time if it is not used
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(18) // Cache for 18 hours, removes after this time even if it is used
                });
            }

            _logger.LogTrace("Gruppdata har cachats. Tid: {time}.", DateTime.Now.ToString("G"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"DashboardService. Failed to cache users by group. Error: {ex.Message}");
        }
    }

    public async Task GetCacheGroupsUsers()
    {
        _cache.TryGetValue("studenter", out List<UserViewModel?>? students);
        _cache.TryGetValue("politiker", out List<UserViewModel?>? politiker);
        _cache.TryGetValue("personal", out List<UserViewModel?>? personal);

        if (students == null || politiker == null || personal == null)
        {
            // Handle the case where one or more user lists are empty
            if (_lockService.TryStart("cacheKey", out var waitTask))
            {
                try
                {
                    await CacheUsersByGroup();
                }
                catch (Exception ex)
                {
                    _logger.LogError($"DashboardService. Failed to cache users by group for user with permissions. Error: {ex.Message}");
                }
                finally
                {
                    _lockService.Finish("caching");
                }
            }
        }
    }

    public async Task StoreUsersByGroup(string? username = null, List<string>? groups = null)
    {
        _logger.LogTrace("Starting asynchronous dashboard data setup.");

        // Session users calims data
        if (string.IsNullOrEmpty(username))
        {
            var claims = _credentials.GetClaims(["username", "permissions"]);
            if (claims == null)
            {
                _logger.LogWarning("No claims available from credentials; aborting StoreUsersByGroup.");
                return;
            }
            claims.TryGetValue("username", out username);
            groups ??= claims!.TryGetValue("permissions", out string? permissions) ? [.. permissions.Split(',')] : [];
        }

        if (string.IsNullOrEmpty(username))
            return;

        if (_lockService.TryStart(username, out var waitTask))
        {
            try
            {
                var moderators = await _localFileService.GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];
                var permissions = moderators.FirstOrDefault(x => string.Equals(x.Username, username, StringComparison.OrdinalIgnoreCase))?.Permissions;

                // Lopp of all employees groups
                foreach (var group in groups ?? [])
                {
                    // If the user is not a member of the support group and not a member of the current password management group, continue
                    if (!groups!.Contains(group, StringComparer.OrdinalIgnoreCase))
                        continue;

                    var cacheKey = group?.ToLower();
                    var groupCacheKey = $"{cacheKey}:{username.ToLower()}";
                    _cache.TryGetValue(groupCacheKey!, out List<UserViewModel?>? cachedGroupMembers);
                    if (cachedGroupMembers?.Count > 0)
                        continue;


                    var (alternativeParams, isStudents) = await GetParams(group!, username, false);
                    _cache.TryGetValue(cacheKey!, out List<UserViewModel?>? cachedUsers);

                    cachedGroupMembers = await _cache.GetOrCreateAsync(groupCacheKey, async entry =>
                    {
                        entry.SlidingExpiration = TimeSpan.FromHours(3); // Cache for 8 hours, removes after this time if it is not used
                        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(2); // Cache for 1 day, removes after this time even if it is used

                        // If group are Students
                        if (isStudents)
                        {
                            cachedUsers ??= await _googleService.GetStudentsFromGoogleApi() ?? [];

                            if (alternativeParams.Count > 0)
                            {
                                // Filter students by office prefix matching any alternative param
                                return cachedUsers?.Where(x => !string.IsNullOrEmpty(x.Office)
                                    && alternativeParams.Any(p => x.Office!.StartsWith(p, StringComparison.OrdinalIgnoreCase)))?.ToList();
                            }
                        }
                        else if (cachedUsers != null && cachedUsers.Count > 0)
                        {
                            var moderators = await _localFileService.GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];
                            var mu = moderators.Select(m => m.Username).ToList();

                            List<UserViewModel> sorted = [.. cachedUsers
                            .OfType<UserViewModel>()
                            .Where(employee => employee.Manager is { } manager
                                && alternativeParams.Any(parameter => manager.Contains(parameter, StringComparison.OrdinalIgnoreCase))
                                && !mu.Contains(employee.Username, StringComparer.OrdinalIgnoreCase))];

                            if (string.Equals(group, "Personal", StringComparison.OrdinalIgnoreCase))
                            {
                                var permissions = moderators.FirstOrDefault(x => string.Equals(x.Username, username, StringComparison.OrdinalIgnoreCase))?.Permissions;
                                var pe = permissions?.Employees ?? [];
                                var po = permissions?.Offices ?? [];

                                var sortedUsernames = sorted.Select(s => s.Username).ToList();
                                foreach (var user in cachedUsers)
                                {
                                    if (sortedUsernames.Contains(user!.Username, StringComparer.OrdinalIgnoreCase))
                                        continue;
                                    else if ((po.Count > 0 && po.Contains(user.Office!, StringComparer.OrdinalIgnoreCase) && !mu.Contains(user.Username, StringComparer.OrdinalIgnoreCase)))
                                    {
                                        sorted.Add(user);
                                        continue;
                                    }
                                    else if (pe.Count > 0 && pe.Contains(user.Username!, StringComparer.OrdinalIgnoreCase))
                                    {
                                        sorted.Add(user);
                                        continue;
                                    }
                                }
                            }

                            cachedUsers = sorted!;
                        }
                        else
                        {
                            var employees = await _provider.GetUsersByGroupNameFilteredByUserPermissions(group, username, alternativeParams);

                            // Users model to view
                            cachedUsers = [.. employees?.Select(s => new UserViewModel(s))!];
                            _ = cachedUsers?.ConvertAll(x => x.Group = group).ToList();
                            _ = cachedUsers?.ConvertAll(x => x.PasswordLength = 12).ToList();
                        }

                        return cachedUsers;
                    });

                    _logger.LogTrace("Gruppdata har laddats ner. Group: {group}. Tid: {time}.", group, DateTime.Now.ToString("G"));
                }

                _logger.LogTrace("Dashboard data setup completed.");
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

    public async Task<List<UserViewModel>> GetStoredUsersGroup(string group, string? username = null)
    {
        username ??= _credentials.GetClaim("username");
        bool isLoading = _lockService.IsLocked(username!);
        if (isLoading)
            await Task.WhenAny(_lockService.GetWaitTask(username!), Task.Delay(3000));

        if (string.Equals(group, "Overview", StringComparison.OrdinalIgnoreCase))
            return GetGroupsCachedUsers();

        var openAccess = _credentials.GetClaim("openAccess") != null;
        var cacheKey = (openAccess || string.IsNullOrEmpty(username)) ? group.ToLower() : $"{group.ToLower()}:{username?.ToLower()}";

        if (_cache.TryGetValue(cacheKey, out List<UserViewModel>? cachedGroups))
            return cachedGroups ?? [];

        return [];
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
            if (_cache.TryGetValue(group!.ToLower(), out List<UserViewModel>? cached))
            {
                groupModels.AddRange(cached!);
            }
        }

        return groupModels;
    }

    public async Task UpdateApprovedEmployees(string? username, List<string> newApproved)
    {
        if (string.IsNullOrEmpty(username) || newApproved?.Count == 0)
            return;

        var lockKey = "approved-change";
        if (_lockService.TryStart(lockKey, out var waitTask))
        {
            try
            {
                var moderators = await _localFileService.GetEncryptedFile<List<Models.User>>("catalogs/moderators") ?? [];
                var permissions = moderators.FirstOrDefault(x => string.Equals(x.Username, username, StringComparison.OrdinalIgnoreCase))?.Permissions;
                HashSet<string> approved = permissions != null ? [.. (permissions?.Employees ?? [])] : [];

                foreach (var emp in newApproved)
                {
                    approved.Add(emp);
                }

                foreach (var moderator in moderators)
                {
                    if (string.Equals(moderator.Username, username, StringComparison.OrdinalIgnoreCase))
                    {
                        moderator.Permissions?.Employees = [.. approved];
                    }
                }

                await _localFileService.EncrypteToFile(moderators, "catalogs/approved-employees");

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