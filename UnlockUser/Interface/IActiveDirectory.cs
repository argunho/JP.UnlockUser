using UnlockUser.Extensions;
using UnlockUser.ViewModels;
using System.DirectoryServices.AccountManagement;
using UnlockUser.Models;
using System.DirectoryServices;

namespace UnlockUser.Interface;

public interface IActiveDirectory
{
    UserPrincipal FindUserByName(string name);
    UserPrincipalExtension FindUserByExtensionProperty(string name);
    GroupPrincipal FindGroupName(string name);
    bool AccessValidation(string? name, string? password);
    bool MembershipCheck(string? username, string? groupName);
    string ResetPassword(UserViewModel model);
    string UnlockUser(UserViewModel model);
    DirectorySearcher GetMembers(string? groupName);
    List<User> GetUsers(DirectorySearcher result);
    PrincipalContext GetContext();
}
