using System.DirectoryServices;

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
        #region Get managers & politicians to save to file
        List<User> managers = [];
        List<User> politicians = [];
        DirectorySearcher search = new(_provider.GetContext().Name)
        {
            Filter = "(title=*)",
            PageSize = 1000
        };

        search = _provider.UpdatedProparties(search);
        List<SearchResult>? list = [.. search.FindAll().OfType<SearchResult>()];

        List<string> _politicians = _provider.GetSecurityGroupMembers("Ciceron-Assistentanvändare");
        foreach (SearchResult res in list)
        {
            var user = new UserViewModel(_provider.GetUserParams(res.Properties)!);
            if (user.Title != null && _provider.CheckManager(user.Title))
                managers.Add(user);
            if (_politicians.Contains(user.Name, StringComparer.OrdinalIgnoreCase))
                politicians.Add(user);
        }

        var managersToSave = managers.Select(s => new Manager
        {
            Username = s.Name,
            DisplayName = s.DisplayName,
            Office = s.Office,
            Department = s.Department,
            Division = s.Division,
            ManagerName = !string.IsNullOrEmpty(s.Manager) ? s.Manager.Trim()?[3..s.Manager.IndexOf(',')] : "",
            Disabled = false,
            Default = false
        }).ToList();

        await _localFileService.SaveUpdateEncryptedFile(managersToSave, "catalogs/managers");
        await _localFileService.SaveUpdateEncryptedFile(politicians, "catalogs/politicians");
        #endregion

        #region Get employees        
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>();
        var currentSavedList = _localFileService.GetListFromEncryptedFile<UserViewModel>("catalogs/employees") ?? [];
        var schools = _localFileService.GetListFromEncryptedFile<School>("catalogs/schools");
        List<User> users = [];

        foreach (var group in groups!)
        {
            List<string> membersUsernames = [.. _provider.GetSecurityGroupMembers(group.PermissionGroup)];

            for (int i = 0; i < membersUsernames.Count; i++)
            {
                string username = membersUsernames[i];

                User? newUser = users.FirstOrDefault(x => x.Name == username);
                PermissionsViewModel? permissions = newUser != null ? newUser.Permissions : new();

                permissions!.Groups.Add(group.Name!);

                if (newUser != null)
                    continue;
                else
                    newUser ??= new();

                var savedUser = currentSavedList?.FirstOrDefault(x => x.Name == username);
                var userPermissions = savedUser?.Permissions;

                // Get user
                UserPrincipalExtension? user = _provider.FindUserByUsername(username);
                if (user == null)
                    continue;

                bool isSchool = group.Name == "Studenter" && ((string.Equals(user.Division, "Arbete och Lärande", StringComparison.OrdinalIgnoreCase)
                                                  || string.Equals(user.Division, "Utbildningsförvalltning", StringComparison.OrdinalIgnoreCase)));

                if (savedUser != null && string.Equals(savedUser.Manager, user.Manager, StringComparison.OrdinalIgnoreCase))
                {
                    permissions!.Managers = userPermissions!.Managers;
                    permissions!.Politicians = userPermissions!.Politicians;
                    permissions.Schools = userPermissions!.Schools;
                }
                else
                {
                    if (!string.IsNullOrEmpty(user.Manager) && group.Name == "Personal")
                        permissions.Managers.Add(user.Manager.Trim()?[3..user.Manager.IndexOf(',')]!);
                    else if (group.Name == "Politiker")
                        permissions.Politicians = [];
                    else if (isSchool)
                        permissions.Schools.Add(user.Office);
                }

                if (isSchool && !string.IsNullOrWhiteSpace(user!.Office) && !permissions.Schools.Contains(user!.Office, StringComparer.OrdinalIgnoreCase))
                    permissions.Schools.Add(user.Office);

                newUser.Name = user.SamAccountName;
                newUser.DisplayName = user.DisplayName;
                newUser.Email = user.EmailAddress;
                newUser.Office = user.Office;
                newUser.Title = user.Title;
                newUser.Department = user.Department;
                newUser.Division = user.Division;
                newUser.Manager = user.Manager;

                // Check all school staff
                if (group.Group == "Students")
                {
                    foreach (var school in schools)
                    {
                        if (user!.Office.Contains(school.Name!, StringComparison.OrdinalIgnoreCase)
                            && !permissions.Schools.Contains(school.Name!, StringComparer.OrdinalIgnoreCase))
                            permissions.Schools.Add(school.Name!);
                    }
                }

                newUser.Managers = _provider.GetUserManagers(newUser);

                permissions.Managers = [.. permissions.Managers.OrderBy(x => x)];
                permissions.Politicians = [.. permissions.Politicians.OrderBy(x => x)];
                permissions.Schools = [.. permissions.Schools.OrderBy(x => x)];
                newUser.Permissions = permissions;
                users.Add(newUser);
            }
        }

        await _localFileService.SaveUpdateEncryptedFile([.. users.OrderBy(o => o.DisplayName)], "catalogs/employees");
       #endregion
    }

    public User? GetUserFromFile(string username)
    {
        List<UserViewModel> employees = _localFileService.GetListFromEncryptedFile<UserViewModel>("catalogs/employees") ?? [];
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
            users = [.. users.Where(x => permissions.Schools.Contains(x.Office, StringComparer.OrdinalIgnoreCase))];

        return users;
    }

    #region Help methods
    #endregion
}
