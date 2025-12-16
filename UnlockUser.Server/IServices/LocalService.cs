
using Newtonsoft.Json;
using UnlockUser.Server.Interface;
using UnlockUser.Server.Models;

namespace UnlockUser.Server.IServices;

public class LocalService(ILocalFileService localFileService, IActiveDirectory provider) : ILocalService
{
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IActiveDirectory _provider = provider;

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
        if(string.IsNullOrEmpty(groupName) || string.IsNullOrEmpty(claimPermission)) return users;

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
