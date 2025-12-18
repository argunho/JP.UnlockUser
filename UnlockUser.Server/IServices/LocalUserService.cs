using Newtonsoft.Json;
using System.DirectoryServices;
using UnlockUser.Server.Interface;

namespace UnlockUser.Server.IServices;

public class LocalUserService(ILocalFileService localFileService,
    IActiveDirectory provider, IConfiguration config) : ILocalUserService
{
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IActiveDirectory _provider = provider;
    private readonly IConfiguration _config = config;


    // A function to API request Active Directory and save/refresh the list of employees who have permission to change a user password.
    public async Task RenewUsersCachedList()
    {
        #region Get employees        
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>();
        var currentCahchedList = _localFileService.GetListFromFile<UserViewModel>("employees") ?? [];
        var schools = _localFileService.GetListFromFile<School>("schools");
        List<User> employees = [];

        foreach (var group in groups!)
        {
            List<string>? membersUsernames = [.. (_provider.GetSecurityGroupMembers(group.PermissionGroup)).Where(x => x.Length > 6)];

            for (int i = 0; i < membersUsernames?.Count; i++)
            {
                string username = membersUsernames[i];
                User? employee = employees.FirstOrDefault(x => x.Name == username);
                PermissionsViewModel? permissions = employee != null ? employee.Permissions : new();

                permissions!.PasswordManageGroups.Add(group.Name!);

                if (employee != null)
                    continue;
                else
                    employee ??= new();

                var cachedUser = currentCahchedList?.FirstOrDefault(x => x.Name == username);
                var userPermissions = cachedUser?.Permissions;

                // Get user
                UserPrincipalExtension? user = _provider.FindUserByUsername(username);
                if (user == null || user.SamAccountName.Length < 6)
                    continue;

                if (cachedUser != null && string.Equals(cachedUser.Manager, user.Manager, StringComparison.OrdinalIgnoreCase))
                {
                    permissions!.Managers = userPermissions!.Managers;
                    permissions.Offices = userPermissions!.Offices;
                }
                else
                {
                    permissions.Managers.Add(user.Manager);
                    permissions.Offices.Add(user.Office);
                }

                if (!string.IsNullOrWhiteSpace(user!.Office) && !permissions.Offices.Contains(user!.Office, StringComparer.OrdinalIgnoreCase))
                    permissions.Offices.Add(user.Office);

                employee!.Name = user.SamAccountName;
                employee.DisplayName = user.DisplayName;
                employee.Email = user.EmailAddress;
                employee.Office = user.Office;
                employee.Title = user.Title;
                employee.Department = user.Department;
                employee.Division = user.Division;
                employee.Manager = user.Manager;

                // Check all school staff
                if (group.Group == "Students")
                {
                    foreach (var school in schools)
                    {
                        if (user!.Office.Contains(school.Name!, StringComparison.OrdinalIgnoreCase)
                            && !permissions.Offices.Contains(school.Name!, StringComparer.OrdinalIgnoreCase))
                            permissions.Offices.Add(school.Name!);
                    }
                }

                employee.Managers = _provider.GetUserManagers(employee);

                employee.Permissions = permissions;
                employees.Add(employee);
            }
        }

        await _localFileService.SaveUpdateFile([.. employees.OrderBy(o => o.DisplayName)], "employees");
        #endregion

        #region Get managers
        List<User> managers = [];
        DirectorySearcher search = new(_provider.GetContext().Name)
        {
            Filter = "(title=*)",
            PageSize = 1000
        };

        search = _provider.UpdatedProparties(search);
        List<SearchResult>? list = [.. search.FindAll().OfType<SearchResult>()];

        foreach (SearchResult res in list)
        {
            var user = new UserViewModel(_provider.GetUserParams(res.Properties)!);
            if (user.Title != null && _provider.CheckManager(user.Title))
                managers.Add(user);
        }

        var managersToSave = managers.Select(s => new Manager
        {
            Username = s.Name,
            DisplayName = s.DisplayName,
            Division = s.Division,
            ManagerName = !string.IsNullOrEmpty(s.Manager) ? s.Manager.Trim()?.Substring(3, s.Manager.IndexOf(',') - 3) : "",
            Disabled = false,
            Default = false
        }).ToList();

        await _localFileService.SaveUpdateFile(managersToSave, "managers");
        #endregion
    }

    public User? GetUserFromFile(string username)
    {
        List<UserViewModel> employees = _localFileService.GetListFromFile<UserViewModel>("employees") ?? [];
        UserViewModel? user = employees?.FirstOrDefault(x => x.Name == username);
        return user;
    }

    public List<Manager> GetUsersManagers(string username, string groupName)
    {
        var user = GetUserFromFile(username);
        return user?.Managers.Where(x => !x.Disabled).ToList() ?? [];
    }

    // Usersr filter
    public List<User> Filter(List<User> users, string? groupName, string? username)
    {
        if (string.IsNullOrEmpty(groupName) || string.IsNullOrEmpty(username)) return users;

        var userCahcedData = GetUserFromFile(username);
        var permissions = userCahcedData?.Permissions ?? new();

        if (!groupName.Equals("Students", StringComparison.OrdinalIgnoreCase))
        {
            users = [.. users.Where(x => permissions.Managers.Contains(x.Manager, StringComparer.OrdinalIgnoreCase))];
            foreach (var user in users)
                user.Managers = _provider.GetUserManagers(user);
        }
        else
            users = [.. users.Where(x => permissions.Offices.Contains(x.Office, StringComparer.OrdinalIgnoreCase))];

        return users;
    }

    #region Help methods
    #endregion
}
