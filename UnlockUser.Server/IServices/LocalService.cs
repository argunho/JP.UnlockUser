
using UnlockUser.Server.Models;

namespace UnlockUser.Server.IServices;

public class LocalService(ILocalFileService localFileService) : ILocalService
{
    private readonly ILocalFileService _localFileService = localFileService;

    public User GetUserFromFile(string username, string groupName)
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
}
