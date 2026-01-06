namespace UnlockUser.Server.Interface;

public interface ILocalUserService
{
    Task RenewUsersCachedList();
    Task<User?> GetUserFromFile(string username);
    Task<List<Manager>> GetUsersManagers(string username, string groupName);
    Task<List<User>> Filter(List<User> users, string? groupName, string? username);
}
