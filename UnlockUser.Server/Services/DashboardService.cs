using Google.Apis.Admin.Directory.directory_v1.Data;
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


    public async Task StoreUsersByGroup(string? username = null, List<string>? sessionUserGroups = null, bool openAccess = false)
    {
        _logger.LogInformation("Starting asynchronous dashboard data setup.");

        // Session users calims data
        if (string.IsNullOrEmpty(username))
        {
            var claims = _credentials.GetClaims(["username", "openAccess", "permissions"]);
            if (claims == null)
            {
                _logger.LogWarning("No claims available from credentials; aborting StoreUsersByGroup.");
                return;
            }
            claims.TryGetValue("username", out username);
            openAccess = claims!.TryGetValue("openAccess", out string? access) && bool.Parse(access);
            sessionUserGroups ??= claims!.TryGetValue("permissions", out string? permissions) ? [.. permissions.Split(',')] : [];
        }

        if (string.IsNullOrEmpty(username))
            return;

        if (_lockService.TryStart(username, out var waitTask))
        {
            try
            {
                Dictionary<string, List<UserViewModel>> groups = [];

                // Employee groups where each group has its own password management permissions
                List<GroupModel> passwordManageGroups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];

                // Saved employees who have permission to manage employee passwords
                var moderators = await _localFileService.GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];

                // Lopp of all employees groups
                foreach (var group in passwordManageGroups)
                {
                    // If the user is not a member of the support group and not a member of the current password management group, continue
                    if (!openAccess && !sessionUserGroups!.Contains(group.Name, StringComparer.OrdinalIgnoreCase))
                        continue;

                    var (alternativeParams, isStudents) = await GetParams(group.Name!, username, openAccess);


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

                        // Filter the list of saved employees according to the current password management group
                        // Update permissions in all users of the current password management group based on the filtered saved users
                        foreach (var m in moderators)
                        {
                            var user = employees?.FirstOrDefault(x => x.Username == m.Username);
                            if (user == null)
                                continue;

                            user.Permissions = m.Permissions;
                        }

                        // Users model to view
                        var usersViewModel = employees?.Select(s => new UserViewModel(s)).ToList();
                        _ = usersViewModel?.ConvertAll(x => x.Group = group.Name).ToList();
                        _ = usersViewModel?.ConvertAll(x => x.PasswordLength = 12).ToList();

                        return usersViewModel;
                    });

                    groups.Add(group.Name!.ToLower(), users!);

                    _logger.LogInformation("Gruppdata har laddats ner. Group: {group}. Tid: {time}.", group.Name, DateTime.Now.ToString("G"));
                }

                var options = new MemoryCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromMinutes(15),
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
                };

                _cache.Set($"groups_{_session!.Id}", groups, options);

                _logger.LogInformation("Gruppdata har laddats ner. Group: {group}. Tid: {time}.", groups.Count, DateTime.Now.ToString("G"));
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
}