namespace UnlockUser.Server.Interface;

public interface ILocalService
{
    User? GetUserFromFile(string username, string groupName);
    List<Manager> GetUsersManagers(string username, string groupName);
    List<User> FilteredListOfUsers(List<User> users, bool support,
            string? groupName = null, string? roles = null, string? username = null)
}
