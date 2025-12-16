namespace UnlockUser.Server.Interface;

public interface ILocalService
{
    User? GetUserFromFile(string username, string groupName);
    List<Manager> GetUsersManagers(string username, string groupName);
    List<User> Filter(List<User> users, string? groupName, string? claimPermission);
}
