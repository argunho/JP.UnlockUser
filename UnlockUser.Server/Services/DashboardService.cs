namespace UnlockUser.Server.Services;

using Microsoft.Extensions.Caching.Memory;

public class DashboardService(
        IMemoryCache memoryCache,
        ILocalFileService localFileService,
        IConfiguration config,
        IActiveDirectory provider,
        ILogger<DashboardService> logger
    )
{
    private readonly IMemoryCache _memoryCache = memoryCache;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IConfiguration _config = config;
    private readonly IActiveDirectory _provider = provider;
    private readonly ILogger<DashboardService> _logger = logger;


    public async Task StoreUsersByGroup(string username, bool openAccess, List<string> sessionUserGroups)
    {
        try
        {
            Dictionary<string, List<UserViewModel>> groups = [];

            // Employee groups where each group has its own password management permissions
            List<GroupModel> passwordManageGroups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];

            // Saved employees who have permission to manage employee passwords
            var savedEmployees = await _localFileService.GetListFromEncryptedFile<UserViewModel>("catalogs/moderators") ?? [];

            // Currentsession user permissions
            var sessionUserPermissions = savedEmployees.FirstOrDefault(x => x.Name == username)?.Permissions; // claims["username"])?.Permissions;

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

                // If the user is a member of the support group
                if (!openAccess)
                {
                    if (isStudents)
                        alternativeParams = sessionUserPermissions!.Schools;
                    else if (group.Name == "Politeker")
                        alternativeParams = sessionUserPermissions!.Politicians;
                    else
                        alternativeParams = sessionUserPermissions!.Managers;
                }

                // All users who are members of the current password management group
                var users = (_provider.GetUsersByGroupName(group, alternativeParams)).ToList();

                if (!isStudents)
                {
                    // Filter the list of saved employees according to the current password management group
                    // Update permissions in all users of the current password management group based on the filtered saved users
                    foreach (var employee in savedEmployees)
                    {
                        var user = users?.FirstOrDefault(x => x.Name == employee.Name);
                        if (user == null)
                            continue;

                        user.Permissions = employee.Permissions;
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

            // Save to session memory
            _memoryCache.Set(
               "groups",
                groups,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(60),
                    SlidingExpiration = TimeSpan.FromMinutes(60)
                }
            );

            _logger.LogInformation("Gruppdata har laddats ner. Group: {group}. Tid: {time}.", groups.Count, DateTime.Now.ToString("G"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"DashboardService. Felmeddelande: {ex.Message}");
        }
    }

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

}
