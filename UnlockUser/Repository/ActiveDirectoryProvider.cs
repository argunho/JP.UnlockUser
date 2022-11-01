using UnlockUser.Controllers;
using UnlockUser.Extensions;
using UnlockUser.Interface;
using UnlockUser.ViewModels;
using System.DirectoryServices.AccountManagement;
using UnlockUser.Models;
using System.Diagnostics;

namespace UnlockUser.Repository;

public class ActiveDirectoryProvider : IActiveDirectoryProvider // Help class inherit an interface and this class is a provider to use interface methods into another controller
{
    private string domain = "alvesta";
    private string defaultOU = "DC=alvesta,DC=local";


    #region Interface methods
    public UserPrincipal FindUserByName(string name)
        => UserPrincipal.FindByIdentity(PContext(), name); // Method to get a user from Active Dericotry

    public UserPrincipalExtension FindUserByExtensionProperty(string name) // Method to get a user with extension parameters from Active Dericotry
        => UserPrincipalExtension.FindByIdentity(PContext(), name);

    public GroupPrincipal FindGroupName(string name)
        => GroupPrincipal.FindByIdentity(PContext(), name); // Method to get a group by name

    public bool AccessValidation(string? name, string? password = null)
        => PContext().ValidateCredentials(name, password); // Method to authenticate a user

    // Check user's membership in a specific group in which members have access  to change student password 
    public bool MembershipCheck(string username, string groupname)
    {
        var userPrincipal = FindUserByName(username);
        if (userPrincipal == null) // User does not exist.
            return false;

        List<Principal> groups = userPrincipal.GetAuthorizationGroups().ToList();

        return groups.Find(x => x.Name == groupname) != null;
    }

    public PrincipalContext GetContext() => PContext();

    public string ResetPassword(UserViewModel model) // Method to reset user password
    {
        try
        {
            using (var context = PContexAccessCheck(model.Credentials))
            {
                using (AuthenticablePrincipal user = UserPrincipal.FindByIdentity(context, model.Username))
                {
                    if (user == null)
                        return $"Användaren {model.Username} hittades inte"; // Canceled operation. User {model.Username} not found

                    user.SetPassword(model.Password);
       
                    user.Dispose();
                    return string.Empty;
                }
            }
        }
        catch (Exception ex)
        {
            return "Fel: " + ex?.InnerException?.Message ?? ex.Message + "\n";
        }
    }

    public string UnlockUser(UserViewModel model) // Method to unlock user
    {
        using (var context = PContexAccessCheck(model.Credentials))
        {
            using (AuthenticablePrincipal user = UserPrincipal.FindByIdentity(context, model.Username))
            {
                if (user == null)
                    return $"Användaren {model.Username} hittades inte."; // User not found
                try
                {
                    if (user.IsAccountLockedOut())
                        user.UnlockAccount();
                    else
                        return $"Användarkontot {model.Username} är redan aktiv.";// The process is cancelled! The user's account is not locked!

                    user.Save();
                    return string.Empty;
                }
                catch (Exception ex)
                {
                    return ex.Message;
                }
            }
        }
    }
    #endregion

    #region Helpers
    // Context to build a connection to local host
    public PrincipalContext PContext() =>
        new PrincipalContext(ContextType.Domain, domain, defaultOU);

    // Context to build a connection with credentials to local host
    public PrincipalContext PContexAccessCheck(UserCredentials model)
        => new PrincipalContext(ContextType.Domain, domain, defaultOU, model.Username, model.Password);

    #endregion
}
