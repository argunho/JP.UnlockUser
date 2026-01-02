using System.Diagnostics;
using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;
using UnlockUser.Server.FormModels;

namespace UnlockUser.Server.IServices;

public class ADService : IActiveDirectory // Help class inherit an interface and this class is a provider to use interface methods into another controller
{
    private readonly string domain = "alvesta";
    private readonly string defaultOU = "DC=alvesta,DC=local";

    #region Find user   
    // Method to get a user with extension parameters from Active Dericotry
    public UserPrincipalExtension FindUserByUsername(string name)
        => UserPrincipalExtension.FindByIdentity(GetContext(), name);

    #endregion

    #region Validation
    // Method to authenticate a user
    public bool AccessValidation(string? name, string? password = null)
        => GetContext().ValidateCredentials(name, password);

    // Check user's membership in a specific group in which members have access  to change student password 
    public bool MembershipCheck(UserPrincipalExtension user, string? groupName)
    {
        if (user == null)
            return false;

        List<Principal> groups = user.GetAuthorizationGroups().ToList();

        return groups.Find(x => x.Name == groupName) != null;
    }
    #endregion

    #region Get groups
    // Check user's membership in a specific group in which members have access  to change student password 
    public List<string>? GetUserGroups(UserPrincipalExtension? user)
    {
        if (user == null) // User does not exist.
            return [];

        List<Principal> groups = [.. user.GetAuthorizationGroups()];
        groups ??= [];

        return [.. groups.Select(s => s.Name)];
    }
    #endregion

    #region Get users/members
    // Get members list
    public DirectorySearcher GetMembers(string groupName)
    {
        using DirectoryEntry entry = new($"LDAP://OU={groupName},OU=Users,OU=Kommun,DC=alvesta,DC=local");
        using DirectorySearcher search = new(entry);
        search.PropertiesToLoad.Add("memberOf");
        entry.Close();
        return search;
    }

    // Get users by group name
    public List<User> GetUsersByGroupName(GroupModel group, List<string>? alternativeParams = null)
    {
        List<User> users = [];
        using DirectoryEntry entry = new($"LDAP://OU={group.Group!},OU=Users,OU=Kommun,DC=alvesta,DC=local");
        using DirectorySearcher search = new(entry);
        search.Filter = $"(&(objectClass=User))";

        if (search == null)
            return users;

        DirectorySearcher? res = UpdatedProparties(search);
        res.PropertiesToLoad.Add("memberOf");

        res.PageSize = 1000;
        res.SizeLimit = 0;

        bool isEmployeeGroup = string.Equals(group.Group, "Employees", StringComparison.OrdinalIgnoreCase);

        // Get all users by search group parameters
        foreach (SearchResult? result in res.FindAll().OfType<SearchResult>())
        {
            var props = result.Properties;
            var user = GetUserParams(props);
            if (isEmployeeGroup)
            {
                var properties = props["memberOf"].OfType<string>() ?? [];
                bool isMatch = properties.Any(x => x.Contains("Ciceron-Assistentanvändare", StringComparison.OrdinalIgnoreCase));

                bool isPolitician = string.Equals(group.Name, "Politiker", StringComparison.OrdinalIgnoreCase);
                bool isEmployee = string.Equals(group.Name, "Personal", StringComparison.OrdinalIgnoreCase);
                if (isPolitician && !isMatch)
                    continue;
                else if (isEmployee && isMatch)
                    continue;

                if(isEmployee && alternativeParams!.Contains(user.Manager!.Trim()?[3..user.Manager.IndexOf(',')], StringComparer.OrdinalIgnoreCase))
                    users.Add(user!);
                else if(isPolitician && alternativeParams!.Contains(user!.Name, StringComparer.OrdinalIgnoreCase))
                    users.Add(user!);
            }
            else if (alternativeParams!.Contains(user!.Office!, StringComparer.OrdinalIgnoreCase))
                users.Add(user!);
        }
        entry.Close();

        return users;
    }

    // Get memebrs from security group
    public List<string> GetSecurityGroupMembers(string? groupName)
    {
        using GroupPrincipal group = GroupPrincipal.FindByIdentity(GetContext(), IdentityType.SamAccountName, groupName);
        var members = group.GetMembers(true).Select(s => s.SamAccountName).ToList();
        return members;
    }

    // Return a list of found users
    public List<User> GetUsers(DirectorySearcher? result, string? groupName)
    {
        result = UpdatedProparties(result);
        List<User> users = [];

        List<SearchResult> list = [.. result.FindAll().OfType<SearchResult>()];
        if (groupName != "Studenter" && list != null)
        {
            list = list.Where(x => x.Properties["memberOf"].OfType<string>()
                .Any(x => groupName == "Politiker" ? x.Contains("Ciceron-Assistentanvändare") : !x.Contains("Ciceron-Assistentanvändare"))).ToList();
        }

        if (list.Count == 0) return users;

        foreach (SearchResult res in list)
            users.Add(GetUserParams(res.Properties));

        return users;
    }

    // Get all employee's managers
    public List<Manager> GetUserManagers(User user)
    {
        DirectorySearcher? search = new(GetContext().Name);
        string? userManager = user.Manager;
        if (string.IsNullOrEmpty(userManager))
            return [];

        List<Manager> managers = [];
        while (managers?.Count < 3 && user.Title != "Kommunchef")
        {
            try
            {
                search.Filter = String.Format("distinguishedName={0}", userManager);
                search = UpdatedProparties(search);
                ResultPropertyCollection? properties = search.FindOne().Properties;

                if (properties != null)
                {
                    User? manager = GetUserParams(properties);
                    if (manager == null)
                        break;
                    else if (managers.Exists(m => m.DisplayName == manager.DisplayName && m.Username == manager.Name))
                        break;
                    else if (!string.IsNullOrEmpty(manager.Manager) && manager?.Manager != userManager)
                    {
                        managers.Add(new Manager
                        {
                            Username = manager!.Name,
                            DisplayName = manager.DisplayName,
                            Division = manager.Division,
                            Default = true
                        });

                        userManager = manager.Manager;
                        continue;
                    }
                }
                break;
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
        }

        return managers ?? [];
    }
    #endregion

    #region Actions
    // Context to build a connection to local host
    public PrincipalContext GetContext() => new(ContextType.Domain, domain, defaultOU);

    // Method to reset user password
    public void ResetPassword(UserFormModel model, CredentialsViewModel credentials)
    {
        using var context = PContexAccessCheck(credentials!);
        using AuthenticablePrincipal user = UserPrincipal.FindByIdentity(context, model.Username)!;
        user.SetPassword(model.Password);
        user.Dispose();
    }

    // Method to unlock user
    public string UnlockUser(string username, CredentialsViewModel credentials)
    {
        using var context = PContexAccessCheck(credentials);
        using AuthenticablePrincipal user = UserPrincipal.FindByIdentity(context, username);
        if (user == null)
            return $"Användaren {username} hittades inte."; // User not found

        try
        {
            if (user.IsAccountLockedOut())
                user.UnlockAccount();
            else
                return $"Användarkontot {username} är redan aktiv.";// The process is cancelled! The user's account is not locked!

            user.Save();
            return string.Empty;
        }
        catch (Exception ex)
        {
            return ex.Message;
        }
    }
    #endregion

    #region Helpers
    // Context to build a connection with credentials to local host
    public PrincipalContext PContexAccessCheck(CredentialsViewModel model)
        => new(ContextType.Domain, domain, defaultOU, model.Username, model.Password);

    public DirectorySearcher? UpdatedProparties(DirectorySearcher? result)
    {
        if (result == null)
            return result;

        result?.PropertiesToLoad.Add("cn");
        result?.PropertiesToLoad.Add("displayName");
        result?.PropertiesToLoad.Add("userPrincipalName");
        result?.PropertiesToLoad.Add("physicalDeliveryOfficeName");
        result?.PropertiesToLoad.Add("division");
        result?.PropertiesToLoad.Add("manager");
        result?.PropertiesToLoad.Add("department");
        result?.PropertiesToLoad.Add("title");
        result?.PropertiesToLoad.Add("lockoutTime");
        return result;
    }

    public User? GetUserParams(ResultPropertyCollection? props)
    {
        var isLocked = false;
        if (props == null)
            return null;

        if (props.Contains("lockoutTime") && int.TryParse(props["lockoutTime"]?[0]?.ToString(), out int number))
            isLocked = number >= 1;

        return new User
        {
            Name = props["cn"][0].ToString(),
            DisplayName = props.Contains("displayName") ? props["displayName"][0]?.ToString() : "",
            Email = props.Contains("userPrincipalName") ? props["userPrincipalName"][0]?.ToString() : "",
            Manager = props.Contains("manager") ? props["manager"][0]?.ToString() : "",
            Office = props.Contains("physicalDeliveryOfficeName") ? props["physicalDeliveryOfficeName"][0]?.ToString() : "",
            Division = props.Contains("division") ? props["division"][0]?.ToString() : "",
            Department = props.Contains("department") ? props["department"][0]?.ToString() : "",
            Title = props.Contains("title") ? props["title"][0]?.ToString() : "",
            IsLocked = isLocked
        };
    }

    public bool CheckManager(string jobTitle) =>
        jobTitle.Contains("chef", StringComparison.CurrentCultureIgnoreCase) || jobTitle.ToLower().Contains("rektor", StringComparison.CurrentCultureIgnoreCase);
    #endregion

    #region Not in use
    // Method to get a group by name
    [Obsolete("Not in use")]
    public GroupPrincipal FindGroupName(string name)
        => GroupPrincipal.FindByIdentity(GetContext(), name);
    #endregion
}
