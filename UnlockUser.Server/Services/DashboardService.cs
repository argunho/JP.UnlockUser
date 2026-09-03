namespace UnlockUser.Server.Services;

using Microsoft.Extensions.Caching.Memory;

public class DashboardService(
        IHttpContextAccessor contextAccessor,
        ILocalFileService localFileService,
        IConfiguration config,
        IActiveDirectory provider,
        IMemoryCache memoryCache,
        IGoogleService googleService,
        ILogger<DashboardService> logger
    )
{
    private readonly ISession? _session = contextAccessor.HttpContext!.Session;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IConfiguration _config = config;
    private readonly IActiveDirectory _provider = provider;
    private readonly IMemoryCache _cache = memoryCache;
    private readonly IGoogleService _googleService = googleService;
    private readonly ILogger<DashboardService> _logger = logger;


    public async Task StoreUsersByGroup(string username, bool openAccess, List<string> sessionUserGroups)
    {
        try
        {
            Dictionary<string, List<UserViewModel>> groups = [];

            // Employee groups where each group has its own password management permissions
            List<GroupModel> passwordManageGroups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];

            // Saved employees who have permission to manage employee passwords
            var savedModerators = await _localFileService.GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];

            // Currentsession user permissions
            var sessionUserPermissions = savedModerators.FirstOrDefault(x => x.Username == username)?.Permissions;

            // Lopp of all employees groups
            foreach (var group in passwordManageGroups)
            {
                // If the user is not a member of the support group and not a member of the current password management group, continue
                if (!openAccess && !sessionUserGroups.Contains(group.Name, StringComparer.OrdinalIgnoreCase))
                    continue;

                // Parameters used to filter employees
                List<string>? alternativeParams = [];

                // Verify whether the current password management group is the student group
                bool isStudents = string.Equals(group.Group, "Students", StringComparison.OrdinalIgnoreCase);

                // If the user is not a member of the support group set limited params
                if (!openAccess)
                {
                    if (isStudents)
                        alternativeParams = sessionUserPermissions!.Schools;
                    else if (string.Equals(group.Group, "Politiker", StringComparison.OrdinalIgnoreCase))
                        alternativeParams = sessionUserPermissions!.Politicians;
                    else
                        alternativeParams = sessionUserPermissions!.Managers;
                }

                var cacheKey = ((alternativeParams.Count > 0 && !isStudents) ? $"{group.Name}:{username}" : $"{group.Name}").ToLower();
                List<User>? users = await _cache.GetOrCreateAsync(cacheKey, async entry =>
                {
                    entry.SlidingExpiration = TimeSpan.FromMinutes(30); // Cache for 30 minutes, removes after this time if it is not used
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1); // Cache for 1 day, removes after this time even if it is used

                   return isStudents ? await _googleService.GetStudentsFromGoogle()
                                : [.. (await _provider.GetUsersByGroupName(group, username, alternativeParams))];
                });


                if (!isStudents)
                {
                    // Filter the list of saved employees according to the current password management group
                    // Update permissions in all users of the current password management group based on the filtered saved users
                    foreach (var m in savedModerators)
                    {
                        var user = users?.FirstOrDefault(x => x.Username == m.Username);
                        if (user == null)
                            continue;

                        user.Permissions = m.Permissions;
                    }
                }

                // Users model to view
                var usersViewModel = users?.Select(s => new UserViewModel(s)).ToList();

                if (usersViewModel != null)
                {
                    _ = usersViewModel!.ConvertAll(x => x.Group = group.Name).ToList();

                    if (!isStudents)
                        _ = usersViewModel.ConvertAll(x => x.PasswordLength = 12).ToList();

                    groups.Add(group.Name!.ToLower(), usersViewModel);
                }

                _logger.LogInformation("Gruppdata har laddats ner. Group: {group}. Tid: {time}.", group.Name, DateTime.Now.ToString("G"));
            }

            var id = _session!.Id;
            _cache.Set(
                $"groups_{id}",
                groups,
                TimeSpan.FromMinutes(90)
            );
            _logger.LogInformation("Memory cached. {0}", $"groups_{id}");
            _logger.LogInformation("Gruppdata har laddats ner. Group: {group}. Tid: {time}.", groups.Count, DateTime.Now.ToString("G"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"DashboardService. Felmeddelande: {ex.Message}");
        }
    }
}
