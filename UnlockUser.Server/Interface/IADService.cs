using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;


namespace UnlockUser.Server.Interface;

public interface IADService
{
    UserPrincipalExtension FindUser(string name);
    UserPrincipalExtension FindUserByEmail(string email);

    bool AccessValidation(string? name, string? password);
    string LoginCheck(string? name, string? password = null);
    bool UserIsLocked(string name);
    bool MembershipCheck(UserPrincipalExtension user, string? groupName);

    List<string> GetUserGroups(UserPrincipalExtension user);

    DirectorySearcher GetMembers(string? groupName);
    Task<List<User>> GetUsersByGroupNameFilteredByUserPermissions(string group, string? username = null, List<string>? managers = null);
    Task<Dictionary<string, List<User>>> GetEmployesByGroupName();
    List<string> GetSecurityGroupMembers(string? groupName);
    List<User> GetUsers(DirectorySearcher result, string groupName);
    List<Manager> GetUserManagers(User user);

    PrincipalContext GetContext();
    void ResetPassword(UserFormModel model);
    string UnlockUser(string username);
    DirectorySearcher? UpdatedProparties(DirectorySearcher? result);
    User? GetUserParams(ResultPropertyCollection? props);
    bool CheckManager(string jobTitle);
}
