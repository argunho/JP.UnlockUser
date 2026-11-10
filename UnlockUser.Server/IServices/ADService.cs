using Microsoft.Extensions.Caching.Memory;
using System.Diagnostics;
using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;

namespace UnlockUser.Server.IServices;

public class ADService(IHttpContextAccessor httpContextAccessor, ILocalFileService localFileService, IMemoryCache cache) : IADService // Help class inherit an interface and this class is a provider to use interface methods into another controller
{
    private readonly string domain = "alvesta";
    private readonly string defaultOU = "DC=alvesta,DC=local";

    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IMemoryCache _cache = cache;

    #region Find user   
    // Method to get a user with extension parameters from Active Dericotry
    public UserPrincipalExtension FindUser(string name)
        => UserPrincipalExtension.FindByIdentity(GetContext()!, name);

    public UserPrincipalExtension FindUserByEmail(string email)
    {
        using var userTemplate = new UserPrincipalExtension(GetContext())
        {
            EmailAddress = email
        };

        using var searcher = new PrincipalSearcher(userTemplate);
        return searcher.FindOne() as UserPrincipalExtension;
    }
    #endregion

    #region Validation
    // Method to authenticate a user
    public bool AccessValidation(string? name, string? password = null)
        => string.IsNullOrEmpty(LoginCheck(name, password));

    public string LoginCheck(string? name, string? password = null)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrEmpty(password))
            return "Felaktigt användarnamn eller lösenord.";

        using var context = GetContext()!;
        using var user = UserPrincipalExtension.FindByIdentity(context, name);
        if (user == null)
            return "Felaktigt användarnamn eller lösenord.";

        if (user.Enabled == false)
            return "Kontot är inaktiverat i Active Directory.";

        if (user.IsAccountLockedOut())
            return "Kontot är låst. Kontakta supporten för att låsa upp det.";

        if (user.AccountExpirationDate is DateTime accountExpiration && accountExpiration <= DateTime.Now)
            return "Kontot har gått ut.";

        //if (user.PasswordExpirationDate is DateTime passwordExpiration && passwordExpiration <= DateTime.Now)
        //    return "Lösenordet har gått ut.";

        return context.ValidateCredentials(name, password)
            ? string.Empty
            : "Felaktigt användarnamn eller lösenord.";
    }

    public bool UserIsLocked(string name)
    {

        using var context = GetContext()!;
        using var user = UserPrincipalExtension.FindByIdentity(context, name);
        return user.IsAccountLockedOut();
    }

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

    // Get users by group name filtered by user permissions
    public async Task<List<User>> GetUsersByGroupNameFilteredByUserPermissions(string group, string? username = null, List<string>? alternativeParams = null)
    {
        List<User> employees = [];
        _cache.TryGetValue(group, out List<User>? users);
        if(employees == null)
        {
            var employeesByGroup = await GetEmployesByGroupName();
            if (employeesByGroup.Count > 0)
            {
                foreach (var groupName in employeesByGroup.Keys)
                {
                    var cacheKey = groupName.ToLower();
                    _cache.Set(cacheKey, employeesByGroup[groupName], new MemoryCacheEntryOptions
                    {
                        SlidingExpiration = TimeSpan.FromHours(15), // Cache for 15 hours, removes after this time if it is not used
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(18) // Cache for 18 hours, removes after this time even if it is used
                    });
                }

                employees = group?.ToLower() switch
                {
                    "politiker" => employeesByGroup["politiker"],
                    "personal" => employeesByGroup["personal"],
                    _ => []
                };
            }
        }

        // Saved employees who have permission to manage employee passwords
        var moderators = await _localFileService.GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];
        var permissions = moderators.FirstOrDefault(x => string.Equals(x.Username, username, StringComparison.OrdinalIgnoreCase))?.Permissions;
        var pe = permissions?.Employees ?? [];
        var po = permissions?.Offices ?? [];

        bool isEmployee = group.Equals("personal", StringComparison.OrdinalIgnoreCase);
        bool isPolitician = group.Equals("politiker", StringComparison.OrdinalIgnoreCase);
        foreach (var user in users)
        {
            var moderator = moderators.FirstOrDefault(x => string.Equals(x.Username, user.Username, StringComparison.OrdinalIgnoreCase));
            if (moderator != null)
                user.Permissions = moderator.Permissions;

            if (alternativeParams == null || alternativeParams?.Count == 0)
                employees?.Add(user!);
            else if (isEmployee && !employees!.Exists(x => x.Username == user.Username!))
            {
                if (po.Count > 0 && po.Contains(user.Office!, StringComparer.OrdinalIgnoreCase)
                    && !string.Equals(moderator!.Username, user.Username!, StringComparison.OrdinalIgnoreCase))
                {
                    employees.Add(user);
                    continue;
                }
                else if (pe.Count > 0 && pe.Contains(user.Username!, StringComparer.OrdinalIgnoreCase))
                {
                    employees.Add(user);
                    continue;
                }
                else if (moderator != null)
                    continue;

                if (user.Manager == null)
                    continue;
                var m = user.Manager.Trim();

                // ensure there's enough length for a start index of 3
                if (m.Length <= 3)
                    continue;
                var comma = m.IndexOf(',');

                // ensure comma exists and is after the start index
                if (comma <= 3)
                    continue;

                var part = m.Substring(3, comma - 3);
                //(alternativeParams!.Contains(user.Manager!.Trim()?[3..user.Manager.IndexOf(',')], StringComparer.OrdinalIgnoreCase)
                if (alternativeParams!.Contains(part, StringComparer.OrdinalIgnoreCase))
                {
                    employees.Add(user);
                }
            }
            else if (isPolitician && alternativeParams!.Contains(user.Username, StringComparer.OrdinalIgnoreCase))
                employees.Add(user);
        }


        return employees;
    }

    // Get users by group name
    public async Task<Dictionary<string, List<User>>> GetEmployesByGroupName()
    {
        Dictionary<string, List<User>> users = new()
        {
            { "politiker", [] },
            { "personal", [] }
        };

        using DirectoryEntry entry = new($"LDAP://OU=Employees,OU=Users,OU=Kommun,DC=alvesta,DC=local");
        using DirectorySearcher search = new(entry);
        search.Filter = $"(&(objectClass=User))";

        if (search == null)
            return users;

        DirectorySearcher? res = UpdatedProparties(search);
        res.PropertiesToLoad.Add("memberOf");

        res.PageSize = 1000;
        res.SizeLimit = 0;


        // Get all users by search group parameters
        foreach (SearchResult? result in res.FindAll().OfType<SearchResult>())
        {
            ResultPropertyCollection? props = result.Properties!;
            var user = GetUserParams(props);
            if (user == null)
                continue;
            var properties = props["memberOf"].OfType<string>() ?? [];
            bool isInPoliticianGroup = properties.Any(x => x.Contains("Ciceron-Assistentanvändare", StringComparison.OrdinalIgnoreCase));
            if (isInPoliticianGroup)
                users["politiker"].Add(user);
            else
                users["personal"].Add(user);
        }

        entry.Close();

        return users;
    }

    // Get memebrs from security group
    public List<string?> GetSecurityGroupMembers(string? groupName)
    {
        using GroupPrincipal group = GroupPrincipal.FindByIdentity(GetContext(), IdentityType.SamAccountName, groupName);
        List<string?>? members = [.. group.GetMembers(true).Where(x => x.SamAccountName?.Length > 6).Select(s => s.SamAccountName)];
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
                    else if (managers.Exists(m => m.DisplayName == manager.DisplayName && m.Username == manager.Username))
                        break;
                    else if (!string.IsNullOrEmpty(manager.Manager) && manager?.Manager != userManager)
                    {
                        managers.Add(new Manager
                        {
                            Username = manager!.Username,
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
    public PrincipalContext? GetContext()
        => new(ContextType.Domain, domain, defaultOU);

    // Method to reset user password
    public void ResetPassword(UserFormModel model)
    {
        using var context = PContexAccessCheck();
        using AuthenticablePrincipal user = UserPrincipal.FindByIdentity(context, model.Username);
        user.SetPassword(model.Password);
        user.Dispose();
    }

    // Method to unlock user
    public string UnlockUser(string username)
    {
        using var context = PContexAccessCheck();
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
    public PrincipalContext PContexAccessCheck()
    {
        var _session = _httpContextAccessor.HttpContext!.Session;
        var username = _session.GetString("adminUsername");
        var protectedPassword = _session.Get("adminPassword");

        string password = DpapiProtector.Unprotect(protectedPassword);
        PrincipalContext context = new(ContextType.Domain, domain, defaultOU, username, password);

        return context;
    }

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
        result?.PropertiesToLoad.Add("extensionAttribute1");
        result?.PropertiesToLoad.Add("extensionAttribute9");
        result?.PropertiesToLoad.Add("extensionAttribute10");
        result?.PropertiesToLoad.Add("accountExpires");
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

        string title = props.Contains("title") ? props["title"][0]?.ToString() : "";

        DateTime expires = DateTime.MinValue;
        try
        {
            if (props.Contains("accountExpires"))
            {
                var raw = props["accountExpires"][0]?.ToString();
                if (long.TryParse(raw, out long fileTime))
                {
                    // AD uses 0 or 0x7FFFFFFFFFFFFFFF to indicate 'never'
                    if (fileTime == 0L || fileTime == 9223372036854775807L)
                    {
                        expires = DateTime.MaxValue;
                    }
                    else
                    {
                        expires = DateTime.FromFileTimeUtc(fileTime).ToLocalTime();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
        }


        return new User
        {
            Username = props["cn"][0].ToString(),
            DisplayName = props.Contains("displayName") ? props["displayName"][0]?.ToString() : "",
            Email = props.Contains("userPrincipalName") ? props["userPrincipalName"][0]?.ToString() : "",
            Manager = props.Contains("manager") ? props["manager"][0]?.ToString() : "",
            Office = props.Contains("physicalDeliveryOfficeName") ? props["physicalDeliveryOfficeName"][0]?.ToString() : "",
            Division = props.Contains("division") ? props["division"][0]?.ToString() : "",
            Department = props.Contains("department") ? props["department"][0]?.ToString() : "",
            Expires = expires,
            Title = title,
            IsLocked = isLocked
        };
    }

    public bool CheckManager(string jobTitle) =>
        jobTitle.Contains("chef", StringComparison.CurrentCultureIgnoreCase) || jobTitle.ToLower().Contains("rektor", StringComparison.CurrentCultureIgnoreCase);
    #endregion
}
