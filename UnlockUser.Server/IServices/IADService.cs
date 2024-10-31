using System.DirectoryServices.AccountManagement;
using System.DirectoryServices;
using Newtonsoft.Json;
using System.Diagnostics;
using System.IO;
using UnlockUser.Server.Models;
using System.ComponentModel.Design;

namespace UnlockUser.Server.IServices;

public class IADService : IActiveDirectory // Help class inherit an interface and this class is a provider to use interface methods into another controller
{
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
    public DirectorySearcher GetMembers(string? groupName)
    {
        DirectoryEntry entry = new($"LDAP://OU={groupName},OU=Users,OU=Kommun,DC=alvesta,DC=local");
        DirectorySearcher search = new(entry);
        search.PropertiesToLoad.Add("memberOf");
        entry.Close();
        return search;
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

        List<SearchResult> list = result.FindAll()?.OfType<SearchResult>().ToList();
        if (groupName != "Studenter" && list != null)
        {
            list = list.Where(x => x.Properties["memberOf"].OfType<string>().ToList()
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
        List<Manager> managers = [];

        DirectorySearcher? search = new(GetContext().Name);
        string? userManager = user.Manager;
        bool hasManager = !string.IsNullOrEmpty(userManager);

        //  Check all user bosses if they exist
        if (user.Managers.Count > 0)
        {
            foreach (var manager in user.Managers)
            {
                var checkedManager = FindUserByExtensionProperty(manager.Username);
                if (checkedManager == null || !CheckManager(user.Title))
                    user.Managers.Remove(manager);
            }
        }

        int index = 0;
        while (hasManager && user.Title != "Kommunchef")
        {
            try
            {
                search.Filter = String.Format("distinguishedName={0}", userManager);
                search = UpdatedProparties(search);

                User? manager = GetUserParams(search?.FindOne().Properties);
                if (hasManager = (manager != null) && manager.Manager != userManager)
                {
                    var existing = user.Managers?.Count > 0 ? user.Managers?.First(x => x.Username == manager?.Name) : null;

                    managers.Add(new Manager
                    {
                        Username = manager.Name,
                        DisplayName = manager.DisplayName,
                        Division = manager.Division,
                        Existing = true,
                        Disabled = index != 0 && (existing == null || existing.Disabled)
                    });

                    index++;

                    if (hasManager = !string.IsNullOrEmpty(manager.Manager) && manager.Title != "Kommunchef")
                        userManager = manager.Manager;
                }
            }
            catch (Exception ex)
            {
                hasManager = false;
                Debug.WriteLine(ex.Message);
            }
        }

        if(user.Managers?.Count > 0)
        {
            user.Managers.RemoveAll(x => managers.Contains(x));
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
            var currentList = IHelpService.GetJsonList<GroupUsersViewModel>("employees") ?? [];

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
                    var userOffices = existingUser?.Offices ?? [];
                    if (userOffices.IndexOf(user.Office) == -1)
                        userOffices = [user.Office];

                    // Check all school staff
                    if (group.Manage != "Students")
                    {
                        var schools = IHelpService.GetJsonList<School>("schools");
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

                    if (group.Manage != "Students")
                        employee.Managers = GetUserManagers(existingUser);
                    employees.Add(employee);
                }

                groupEmployees.Add(new GroupUsersViewModel
                {
                    Group = group,
                    Employees = [.. employees.Distinct().ToList().OrderBy(o => o.DisplayName)]
                });
            }

            await IHelpService.SaveUpdateJsonFile(groupEmployees, "employees");
            #endregion

            #region Get managers
            List<User> managers = [];
            DirectorySearcher? search = new(GetContext().Name);

            search.Filter = "(title=*)";
            search.PageSize = 15000;
            search = UpdatedProparties(search);
            List<SearchResult> list = search.FindAll()?.OfType<SearchResult>().ToList();

            foreach (SearchResult res in list)
            {
                var user = GetUserParams(res.Properties);
                if (user.Title != null && CheckManager(user.Title))
                    managers.Add(user);
            }

            await IHelpService.SaveUpdateJsonFile(managers.Select(s => new Manager
            {
                Username = s.Name,
                DisplayName = s.DisplayName,
                Division = s.Division
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
    public PrincipalContext PContexAccessCheck(UserCredentials model)
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

    public User GetUserParams(ResultPropertyCollection? props)
    {
        var isLocked = false;
        if (props.Contains("lockoutTime") && int.TryParse(props["lockoutTime"][0]?.ToString(), out int number))
        {
            isLocked = number >= 1;
        }
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
}
