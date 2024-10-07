using System.DirectoryServices.AccountManagement;
using System.DirectoryServices;

namespace UnlockUser.Server.IServices;

public class IADService : IActiveDirectory // Help class inherit an interface and this class is a provider to use interface methods into another controller
{
    private readonly string domain = "alvesta";
    private readonly string defaultOU = "DC=alvesta,DC=local";

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
    public bool MembershipCheck(UserPrincipalExtension user, string? groupName)
    {
        if (user == null) // User does not exist.
            return false;

        List<Principal> groups = user.GetAuthorizationGroups().ToList();

        return groups.Find(x => x.Name == groupName) != null;
    }

    // Check user's membership in a specific group in which members have access  to change student password 
    public List<string>? GetUserGroups(UserPrincipalExtension user)
    {
        if (user == null) // User does not exist.
            return null;

        List<Principal> groups = user.GetAuthorizationGroups().ToList();

        return groups?.Select(s => s.Name).ToList();
    }

    // Get members list
    public DirectorySearcher GetMembers(string? groupName)
    {
        //var groupName = User.Claims.ToList().FirstOrDefault(x => x.Type == "GroupToManage")?.Value ?? "";
        var groupToFind = groupName?.ToLower() == "studenter" ? "Students" : "Employees";

        DirectoryEntry entry = new($"LDAP://OU={groupToFind},OU=Users,OU=Kommun,DC=alvesta,DC=local");
        DirectorySearcher search = new(entry);
        search.PropertiesToLoad.Add("memberOf");
        entry.Close();
        return search;
    }

    // Get memebrs from security group
    public List<string> GetSecurityGroupMembers(string? groupName)
    {
        using GroupPrincipal group = GroupPrincipal.FindByIdentity(PContext(), IdentityType.SamAccountName, groupName);
        //var members = group.GetMembers(true).ToList();
        List<string> members = group.GetMembers(true).Select(s => s.SamAccountName).ToList();

        return members;
    }

    // Return a list of found users
    public List<User> GetUsers(DirectorySearcher result, string groupName)
    {
        List<User> users = new();
        result?.PropertiesToLoad.Add("cn");
        result?.PropertiesToLoad.Add("displayName");
        result?.PropertiesToLoad.Add("userPrincipalName");
        result?.PropertiesToLoad.Add("physicalDeliveryOfficeName");
        result?.PropertiesToLoad.Add("division");
        result?.PropertiesToLoad.Add("manager");
        result?.PropertiesToLoad.Add("department");
        result?.PropertiesToLoad.Add("title");
        result?.PropertiesToLoad.Add("lockoutTime");

        List<SearchResult> list = result.FindAll().OfType<SearchResult>().ToList() ?? null;
        if (groupName != "studenter" && list != null)
        {
            list = list.Where(x => x.Properties["memberOf"].OfType<string>().ToList()
                .Any(x => groupName == "politiker" ? x.Contains("Ciceron-Assistentanvändare")
                                                     : !x.Contains("Ciceron-Assistentanvändare"))).ToList();
        }

        if (list?.Count == 0) return users;

        foreach (SearchResult res in list)
        {
            var props = res.Properties;


            var isLocked = false;
            if (props.Contains("lockoutTime") && int.TryParse(props["lockoutTime"][0]?.ToString(), out int number))
            {
                isLocked = number >= 1;
            }
            users.Add(new User
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
            });
        }

        return users;
    }

    public PrincipalContext GetContext() => PContext();

    public string ResetPassword(UserViewModel model) // Method to reset user password
    {
        try
        {
            using var context = PContexAccessCheck(model.Credentials);
            using AuthenticablePrincipal user = UserPrincipal.FindByIdentity(context, model.Username);
            if (user == null)
                return $"Användaren {model.Username} hittades inte"; // Canceled operation. User {model.Username} not found

            user.SetPassword(model.Password);

            user.Dispose();
            return string.Empty;
        }
        catch (Exception ex)
        {
            return "Fel: " + ex?.InnerException?.Message ?? ex.Message + "\n";
        }
    }

    public string UnlockUser(UserViewModel model) // Method to unlock user
    {
        using var context = PContexAccessCheck(model.Credentials);
        using AuthenticablePrincipal user = UserPrincipal.FindByIdentity(context, model.Username);
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
    #endregion

    #region Helpers
    // Context to build a connection to local host
    public PrincipalContext PContext() =>
        new(ContextType.Domain, domain, defaultOU);

    // Context to build a connection with credentials to local host
    public PrincipalContext PContexAccessCheck(UserCredentials model)
        => new(ContextType.Domain, domain, defaultOU, model.Username, model.Password);

    #endregion
}
