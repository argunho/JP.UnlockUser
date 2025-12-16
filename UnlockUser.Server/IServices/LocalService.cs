
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


    // Filter of searched users
    public List<User> FilteredListOfUsers(List<User> users, string? groupName = null, string? roles = null, string? username = null)
    {
        // If user is not a member from support group, filter users result
        List<GroupUsersViewModel> groups = HelpService.GetListFromFile<GroupUsersViewModel>("employees") ?? [];
        List<User>? employees = groups.FirstOrDefault(x => x.Group!.Name == groupName)?.Employees;
        User? sessionUser = employees?.FirstOrDefault(x => x.Name == username);
        List<User> usersToView = [];

        if (sessionUser?.Managers.Count > 0 && groupName != "Studenter" && groupName != "Students")
        {
            foreach (var user in users)
            {
                var managers = _provider.GetUserManagers(user)?.Select(s => s.Username)?.ToList() ?? [];
                var sessionUserManagers = sessionUser.Managers.Where(x => !x.Disabled).Select(s => s.Username).ToList() ?? [];
                if (managers.Count > 0)
                {
                    var matched = sessionUserManagers.Intersect(managers);
                    if (matched.Any())
                        usersToView.Add(user);
                }
            }
        }
        else if (groupName == "Studenter" || groupName == "Students")
            users = [.. users.Where(x => sessionUser!.Offices.Contains(x.Office!))];

        users = usersToView;

        return users;
    }
}
