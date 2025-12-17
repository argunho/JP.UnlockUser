
using Newtonsoft.Json;
using System.DirectoryServices;

namespace UnlockUser.Server.IServices;

public class LocalUserService(ILocalFileService localFileService, 
    IActiveDirectory provider, IConfiguration config) : ILocalUserService
{
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IActiveDirectory _provider = provider;
    private readonly IConfiguration _config = config;


    // A function to API request Active Directory and refresh the json list of employees who have permission to change a user password.
    public async Task RenewUsersJsonList()
    {
        #region Get employees        
        var groupEmployees = new List<GroupUsersViewModel>();
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>();
        var currentList = _localFileService.GetListFromFile<GroupUsersViewModel>("employees") ?? [];
        var schools = _localFileService.GetListFromFile<School>("schools");

        foreach (var group in groups!)
        {
            List<string>? members = _provider.GetSecurityGroupMembers(group.PermissionGroup);
            List<User> employees = [];
            var cListByGroup = currentList.FirstOrDefault(x => x.Group?.Name == group.Name)?.Employees;
            foreach (var member in members)
            {
                UserPrincipalExtension user = _provider.FindUserByExtensionProperty(member);
                if (user != null && (user.Equals(default(UserPrincipalExtension)) || user?.SamAccountName.Length < 6))
                    continue;

                // Get member office name
                var existingUser = cListByGroup?.FirstOrDefault(x => x.Name == user?.SamAccountName);
                var userOffices = existingUser?.Offices != null
                 ? [.. existingUser.Offices]
                 : new List<string>();

                if (!string.IsNullOrWhiteSpace(user!.Office) && !userOffices.Contains(user.Office))
                    userOffices.Add(user.Office);

                // Check all school staff
                if (group.Group != "Students")
                {
                    foreach (var school in schools)
                    {
                        if (user.Office.Contains(school.Name!, StringComparison.OrdinalIgnoreCase) && userOffices.IndexOf(school.Name!) == -1)
                            userOffices.Add(school.Name!);
                    }
                }

                var employee = new User
                {
                    Name = user.SamAccountName,
                    DisplayName = user.DisplayName,
                    Email = user.EmailAddress,
                    Office = user.Office,
                    Title = user.Title,
                    Department = user.Department,
                    Division = user.Division,
                    Manager = user.Manager,
                    Offices = userOffices
                };

                // If the existing user is null, convert it to the new user
                existingUser ??= new User { Title = user.Title, Manager = user.Manager };

                if (group.Group != "Students")
                    employee.Managers = _provider.GetUserManagers(existingUser);
                employees.Add(employee);
            }

            groupEmployees.Add(new GroupUsersViewModel
            {
                Group = group,
                Employees = [.. employees.Distinct().ToList().OrderBy(o => o.DisplayName)]
            });
        }

        await _localFileService.SaveUpdateFile(groupEmployees, "employees");
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

        await _localFileService.SaveUpdateFile(managers.Select(s => new Manager
        {
            Username = s.Name,
            DisplayName = s.DisplayName,
            Division = s.Division,
            Disabled = false,
            Default = false
        }).ToList(), "managers");
        #endregion
    }

    public User? GetUserFromFile(string username, string groupName)
    {
        List<GroupUsersViewModel> groups = _localFileService.GetListFromFile<GroupUsersViewModel>("employees") ?? [];
        List<User>? employees = groups.FirstOrDefault(x => x.Group!.Name == groupName)?.Employees;
        User? user = employees?.FirstOrDefault(x => x.Name == username);
        return user;
    }

    public List<Manager> GetUsersManagers(string username, string groupName)
    {
        var user = GetUserFromFile(username, groupName);
        return user?.Managers.Where(x => !x.Disabled).ToList() ?? [];
    }

    // Usersr filter
    public List<User> Filter(List<User> users, string? groupName, string? claimPermission)
    {
        if (string.IsNullOrEmpty(groupName) || string.IsNullOrEmpty(claimPermission)) return users;

        var permissions = JsonConvert.DeserializeObject<PermissionsViewModel>(claimPermission!)!;

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
}
