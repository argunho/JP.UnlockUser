namespace UnlockUser.Server.Interface;

public interface ILocalUserService
{
    Task RenewUsersCachedList();
    User? GetUserFromFile(string username);
    List<Manager> GetUsersManagers(string username, string groupName);
    List<User> Filter(List<User> users, string? groupName, string? username);
}
