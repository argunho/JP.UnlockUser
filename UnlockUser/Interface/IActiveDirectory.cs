using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;
using UnlockUser.Extensions;

namespace UnlockUser.Interface;

public interface IActiveDirectory
{
    UserPrincipal FindUserByName(string name);
    UserPrincipalExtension FindUserByExtensionProperty(string name);
    GroupPrincipal FindGroupName(string name);
    bool AccessValidation(string? name, string? password);
    bool MembershipCheck(UserPrincipalExtension user, string? groupName);
    string ResetPassword(UserViewModel model);
    string UnlockUser(UserViewModel model); 
    DirectorySearcher GetMembers(string? groupName);
    List<string> GetSecurityGroupMembers(string? groupName);
    List<string> GetUserGroups(UserPrincipalExtension user);
    List<User> GetUsers(DirectorySearcher result, string groupName);
    PrincipalContext GetContext();
}
