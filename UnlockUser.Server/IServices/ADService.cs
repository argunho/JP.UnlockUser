using System.Diagnostics;
using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;
using UnlockUser.Server.Models;

namespace UnlockUser.Server.IServices;

public class ADService(ILocalFileService localService) : IActiveDirectory // Help class inherit an interface and this class is a provider to use interface methods into another controller
{
    private readonly ILocalFileService _localService = localService;
    private readonly string domain = "alvesta";
    private readonly string defaultOU = "DC=alvesta,DC=local";

    #region Find user   
    // Method to get a user from Active Dericotry
    public UserPrincipal FindUserByName(string name)
        => UserPrincipal.FindByIdentity(GetContext(), name);

    // Method to get a user with extension parameters from Active Dericotry
    public UserPrincipalExtension FindUserByExtensionProperty(string name)
        => UserPrincipalExtension.FindByIdentity(GetContext(), name);

    // Method to get a group by name
    public GroupPrincipal FindGroupName(string name)
        => GroupPrincipal.FindByIdentity(GetContext(), name);
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
    public List<string>? GetUserGroups(UserPrincipalExtension user)
    {
        if (user == null) // User does not exist.
            return null;

        List<Principal> groups = user.GetAuthorizationGroups().ToList();

        return groups?.Select(s => s.Name).ToList();
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
 
        foreach (SearchResult? result in res.FindAll().OfType<SearchResult>())
        {
            var props = result.Properties;  
            var user = GetUserParams(props);
            if (isEmployeeGroup)
            {
                var properties = props["memberOf"].OfType<string>() ?? [];
                bool isMatch = properties.Any(x => x.Contains("Ciceron-Assistentanvändare", StringComparison.OrdinalIgnoreCase));

                if (string.Equals(group.Name, "Politiker", StringComparison.OrdinalIgnoreCase) && !isMatch)
                    continue;
                else if (string.Equals(group.Name, "Personal", StringComparison.OrdinalIgnoreCase) && isMatch)
                    continue;
            }

            users.Add(user!);
        }
        entry.Close();

        // Removes users that the session user does not have permission to manage.
        List<User> usersToManage = [];
        if (alternativeParams?.Count > 0)
        {
            if (users.Count > 0 && isEmployeeGroup)
            {
                foreach (var m in alternativeParams)
                {
                    var matchUsers = users.Where(x => x.Manager!.StartsWith($"CN={m}", StringComparison.OrdinalIgnoreCase)).ToList() ?? [];
                    usersToManage.AddRange(matchUsers);
                }
            }
            else
                usersToManage = [.. users.Where(x => alternativeParams!.Contains(x.Office!, StringComparer.OrdinalIgnoreCase))];
        } else
            usersToManage = users;

        return usersToManage;
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
        bool hasManager = !string.IsNullOrEmpty(userManager);
        try
        {
            //  Check all user bosses if they exist
            if (user.Managers.Count > 0)
            {
                for (int i = 0; i < user.Managers.Count; i++)
                {
                    var manager = user.Managers[i];
                    var checkedManager = FindUserByExtensionProperty(manager.Username!);
                    if (checkedManager == null || !CheckManager(checkedManager.Title))
                        user.Managers.RemoveAt(i);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
        }


        int index = 0;
        List<Manager> managers = [];
        while (hasManager && user.Title != "Kommunchef")
        {
            try
            {
                search.Filter = String.Format("distinguishedName={0}", userManager);
                search = UpdatedProparties(search);
                var properties = search?.FindOne()?.Properties;

                if (properties != null)
                {
                    User? manager = GetUserParams(properties);
                    hasManager = (manager != null);

                    if (hasManager && managers.Exists(m => m.DisplayName == manager.DisplayName && m.Username == manager.Name))
                        break;
                    else if (hasManager && manager?.Manager != userManager)
                    {
                        var existing = user.Managers?.ToList().FirstOrDefault(x => x.Username!.Equals(manager?.Name, StringComparison.OrdinalIgnoreCase)
                                        || x.Username.Contains(manager?.Name!, StringComparison.OrdinalIgnoreCase));


                        managers.Add(new Manager
                        {
                            Username = manager!.Name,
                            DisplayName = manager.DisplayName,
                            Division = manager.Division,
                            Default = true,
                            Disabled = index != 0 && (existing == null || existing.Disabled)
                        });

                        index++;

                        if (hasManager = !string.IsNullOrEmpty(manager.Manager) && manager.Title != "Kommunchef")
                            userManager = manager.Manager;
                    }
                    else
                        break;
                }
                else
                {
                    hasManager = false;
                }
            }
            catch (Exception ex)
            {
                hasManager = false;
                Debug.WriteLine(ex.Message);
            }
        }

        if (user.Managers?.Count > 0)
        {
            user.Managers.RemoveAll(x => managers.Select(s => x.Username).ToList().Contains(x.Username));
            managers.AddRange(user.Managers);
        }

        return managers.Distinct().ToList() ?? [];
    }
    #endregion

    #region Actions
    // Context to build a connection to local host
    public PrincipalContext GetContext() => new(ContextType.Domain, domain, defaultOU);

    // A function to API request Active Directory and refresh the json list of employees who have permission to change a user password.
    public async Task<string> RenewUsersJsonList(IConfiguration config)
    {
        try
        {
            #region Get employees        
            var groupEmployees = new List<GroupUsersViewModel>();
            var groups = config.GetSection("Groups").Get<List<GroupModel>>();
            var currentList = HelpService.GetListFromFile<GroupUsersViewModel>("employees") ?? [];
            var schools = HelpService.GetListFromFile<School>("schools");

            foreach (var group in groups)
            {
                List<string>? members = GetSecurityGroupMembers(group.PermissionGroup);
                List<User> employees = [];
                var cListByGroup = currentList.FirstOrDefault(x => x.Group?.Name == group.Name)?.Employees;
                foreach (var member in members)
                {
                    UserPrincipalExtension user = FindUserByExtensionProperty(member);
                    if (user != null && (user.Equals(default(UserPrincipalExtension)) || user?.SamAccountName.Length < 6))
                        continue;

                    // Get member office name
                    var existingUser = cListByGroup?.FirstOrDefault(x => x.Name == user?.SamAccountName);
                    var userOffices = existingUser?.Offices != null
                     ? [.. existingUser.Offices]
                     : new List<string>();

                    if (!string.IsNullOrWhiteSpace(user.Office) && !userOffices.Contains(user.Office))
                        userOffices.Add(user.Office);

                    // Check all school staff
                    if (group.Group != "Students")
                    {
                        foreach (var school in schools)
                        {
                            if (user.Office.Contains(school.Name) && userOffices.IndexOf(school.Name) == -1)
                                userOffices.Add(school.Name);
                        }
                    }

                    var employee = new User
                    {
                        Name = user.SamAccountName,
                        DisplayName = user.DisplayName,
                        Email = user.EmailAddress,
                        Office = user.Office,
                        Title = user.Title,
                        Department = user.Department,
                        Division = user.Division,
                        Manager = user.Manager,
                        Offices = userOffices
                    };

                    // If the existing user is null, convert it to the new user
                    existingUser ??= new User { Title = user.Title, Manager = user.Manager };

                    if (group.Group != "Students")
                        employee.Managers = GetUserManagers(existingUser);
                    employees.Add(employee);
                }

                groupEmployees.Add(new GroupUsersViewModel
                {
                    Group = group,
                    Employees = [.. employees.Distinct().ToList().OrderBy(o => o.DisplayName)]
                });
            }

            await HelpService.SaveUpdateFile(groupEmployees, "employees");
            #endregion

            #region Get managers
            List<User> managers = [];
            DirectorySearcher? search = new(GetContext().Name);

            search.Filter = "(title=*)";
            search.PageSize = 1000;
            search = UpdatedProparties(search);
            List<SearchResult> list = search.FindAll()?.OfType<SearchResult>().ToList();

            foreach (SearchResult res in list)
            {
                var user = GetUserParams(res.Properties);
                if (user.Title != null && CheckManager(user.Title))
                    managers.Add(user);
            }

            await HelpService.SaveUpdateFile(managers.Select(s => new Manager
            {
                Username = s.Name,
                DisplayName = s.DisplayName,
                Division = s.Division,
                Disabled = false,
                Default = false
            }).ToList(), "managers");
            #endregion
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Error UnlockUser: GetEmployees: {ex.Message}");
            return ex.Message;
        }

        return String.Empty;
    }

    // Method to reset user password
    public string ResetPassword(UserViewModel model)
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

    // Method to unlock user
    public string UnlockUser(UserViewModel model)
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
    // Context to build a connection with credentials to local host
    public PrincipalContext PContexAccessCheck(UserCredentialsViewModel model)
        => new(ContextType.Domain, domain, defaultOU, model.Username, model.Password);

    public DirectorySearcher? UpdatedProparties(DirectorySearcher? result)
    {
        if (result != null)
        {
            result?.PropertiesToLoad.Add("cn");
            result?.PropertiesToLoad.Add("displayName");
            result?.PropertiesToLoad.Add("userPrincipalName");
            result?.PropertiesToLoad.Add("physicalDeliveryOfficeName");
            result?.PropertiesToLoad.Add("division");
            result?.PropertiesToLoad.Add("manager");
            result?.PropertiesToLoad.Add("department");
            result?.PropertiesToLoad.Add("title");
            result?.PropertiesToLoad.Add("lockoutTime");
        }

        return result;
    }

    public User? GetUserParams(ResultPropertyCollection? props)
    {
        var isLocked = false;
        if (props != null)
        {
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

        return null;
    }

    public bool CheckManager(string jobTitle) =>
        jobTitle.Contains("chef", StringComparison.CurrentCultureIgnoreCase) || jobTitle.ToLower().Contains("rektor", StringComparison.CurrentCultureIgnoreCase);
    #endregion
}
