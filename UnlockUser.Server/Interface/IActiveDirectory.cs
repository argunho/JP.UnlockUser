using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;


namespace UnlockUser.Server.Interface;

public interface IActiveDirectory
{
    UserPrincipal FindUserByName(string name);
    UserPrincipalExtension FindUserByExtensionProperty(string name);
    GroupPrincipal FindGroupName(string name);

    bool AccessValidation(string? name, string? password);
    bool MembershipCheck(UserPrincipalExtension user, string? groupName);

    List<string> GetUserGroups(UserPrincipalExtension user);

    DirectorySearcher GetMembers(string? groupName);
    List<User> GetUsersByGroupName(GroupModel group, List<string>? managers = null);
    List<string> GetSecurityGroupMembers(string? groupName);
    List<User> GetUsers(DirectorySearcher result, string groupName);
    List<Manager> GetUserManagers(User user);

    PrincipalContext GetContext();
    void ResetPassword(UserViewModel model);
    string UnlockUser(UserViewModel model); 
    Task<string> RenewUsersJsonList(IConfiguration config);
}
