using Microsoft.IdentityModel.Tokens.Experimental;
using System.DirectoryServices;

namespace UnlockUser.Server.IServices;

public class LocalUserService(ILocalFileService localFileService,
    IADService provider, IConfiguration config) : ILocalUserService
{
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IADService _provider = provider;
    private readonly IConfiguration _config = config;


    // A function to API request Active Directory and save/refresh the list of employees who have permission to change a user password.
    public async Task RenewUsersCachedList()
    {
        var currentDate = DateTime.Now.Date;
        #region Get managers & politicians to save to file
        List<User> managers = [];
        List<User> politicians = [];
        DirectorySearcher search = new(_provider.GetContext().Name)
        {
            Filter = "(title=*)",
            PageSize = 1000
        };

        search = _provider.UpdatedProparties(search);
        List<SearchResult>? list = [.. search.FindAll().OfType<SearchResult>()];

        List<string> _politicians = _provider.GetSecurityGroupMembers("Ciceron-Assistentanvändare");
        foreach (SearchResult res in list)
        {
            var user = new UserViewModel(_provider.GetUserParams(res.Properties)!);

            if (user.Expires != null && currentDate > user.Expires?.Date)
                continue;

            if (user.Title != null && _provider.CheckManager(user.Title))
                managers.Add(user);
            if (_politicians.Contains(user.Username, StringComparer.OrdinalIgnoreCase))
                politicians.Add(user);
        }

        var managersToSave = managers.Select(s => new Manager
        {
            Username = s.Username,
            DisplayName = s.DisplayName,
            Office = s.Office,
            Department = s.Department,
            Division = s.Division,
            //ManagerName = !string.IsNullOrEmpty(s.Manager) ? s.Manager.Trim()?[3..s.Manager.IndexOf(',')] : "",
            ManagerName = !string.IsNullOrEmpty(s.Manager) ? ExtractManagerName(s.Manager) : "",
            Disabled = false,
            Default = false
        }).ToList();

        await _localFileService.EncrypteToFile(managersToSave, "catalogs/managers");
        await _localFileService.EncrypteToFile(politicians, "catalogs/politicians");
        #endregion

        #region Get employees        
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>();
        var currentModerators = await _localFileService.GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];
        var currentSchools = await _localFileService.GetEncryptedFile<List<School>>("catalogs/schools");

        // Используем Dictionary для быстрого поиска пользователей.
        // OrdinalIgnoreCase предотвращает появление двух пользователей
        // из-за разницы в регистре имени пользователя.
        var usersByUsername = new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase); // -

        // Используем Dictionary для быстрого поиска пользователей.
        // OrdinalIgnoreCase предотвращает появление двух пользователей
        // Здесь сохраняются реальные группы каждого пользователя.
        var groupsByUsername = new Dictionary<string, List<GroupModel>>(StringComparer.OrdinalIgnoreCase); // -

        foreach (var group in groups!)
        {
            if (string.IsNullOrWhiteSpace(group.PermissionGroup))
                continue; // -

            List<string> membersUsernames = [.. _provider.GetSecurityGroupMembers(group.PermissionGroup)];

            for (int i = 0; i < membersUsernames.Count; i++)
            {
                string username = membersUsernames[i];

                // Сохраняем реальную группу пользователя.
                if (!groupsByUsername.TryGetValue(username, out var userGroups))
                {
                    userGroups = [];
                    groupsByUsername[username] = userGroups;
                }

                bool groupAlreadyAdded = userGroups.Any(x => string.Equals(x.Name, group.Name, StringComparison.OrdinalIgnoreCase) &&
                                    string.Equals(x.Group, group.Group, StringComparison.OrdinalIgnoreCase));

                if (!groupAlreadyAdded)
                    userGroups.Add(group);

                // Если пользователь уже загружен, повторно из AD его не читаем.
                if (usersByUsername.ContainsKey(username))
                    continue;

                UserPrincipalExtension? directoryUser = _provider.FindUser(username);
                if (directoryUser is null)
                    continue;
                else if(directoryUser.AccountExpirationDate! != null && DateTime.TryParse(directoryUser.AccountExpirationDate?.ToString(), out DateTime expires) && expires.Date < currentDate)
                    continue;

                User newUser = new()
                {
                    Username = directoryUser.SamAccountName,
                    DisplayName = directoryUser.DisplayName,
                    Email = directoryUser.EmailAddress,
                    Office = directoryUser.Office,
                    Title = directoryUser.Title,
                    Department = directoryUser.Department,
                    Division = directoryUser.Division,
                    Manager = directoryUser.Manager
                };

                newUser.Managers = _provider.GetUserManagers(newUser);

                usersByUsername[username] = newUser;
            }
        }

        foreach (var userEntry in usersByUsername)
        {
            string username = userEntry.Key; // -
            User user = userEntry.Value; // -

            var permissions = user.Permissions ?? new();

            if (!groupsByUsername.TryGetValue(username, out var userGroups)) // -
                userGroups = [];

            // Сохраняем только те группы, в которых действительно
            // состоит конкретный пользователь.
            permissions.Groups = [.. userGroups
                    .Select(x => x.Name)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x!)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
                ];

            var moderator = currentModerators.FirstOrDefault(x => string.Equals(x.Username, user.Username, StringComparison.OrdinalIgnoreCase));
            bool canPreserveCurrentPermissions = moderator?.Permissions is not null && string.Equals(moderator.Manager, user.Manager, StringComparison.OrdinalIgnoreCase);

            if (canPreserveCurrentPermissions)
            {
                // Руководитель не изменился.
                // Копируем сохранённые права в новые списки.
                permissions.Managers = [.. moderator!.Permissions!.Managers.Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x, StringComparer.OrdinalIgnoreCase)];
                permissions.Politicians = [.. moderator.Permissions.Politicians.Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x, StringComparer.OrdinalIgnoreCase)];
                permissions.Schools = [.. moderator.Permissions.Schools.Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x, StringComparer.OrdinalIgnoreCase)];
            }
            else
            {
                // Пользователь новый или его руководитель изменился.
                // Поэтому права нужно рассчитать заново.
                var userManagers = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var userPoliticians = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var userSchools = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var group in userGroups)
                {

                    bool isPersonalGroup = string.Equals(group.Name, "Personal", StringComparison.OrdinalIgnoreCase);
                    bool isPoliticianGroup = string.Equals(group.Name, "Politiker", StringComparison.OrdinalIgnoreCase);
                    bool isStudentsGroup = string.Equals(group.Name, "Studenter", StringComparison.OrdinalIgnoreCase);

                    if (isPersonalGroup)
                    {
                        string? managerName = ExtractManagerName(user.Manager);

                        if (!string.IsNullOrWhiteSpace(managerName))
                            userManagers.Add(managerName);
                    }
                    else if (isPoliticianGroup)
                    {
                        // Сохраняет поведение старого решения:
                        // список политиков создаётся пустым.
                        politicians.Clear();
                    }

                    // Проверяем все школы только для соответствующей
                    // группы конкретного пользователя.
                    if (isStudentsGroup && !string.IsNullOrWhiteSpace(user.Office))
                    {
                        if (string.Equals(user.Division, "Arbete och Lärande", StringComparison.OrdinalIgnoreCase)
                            || string.Equals(user.Division, "Utbildningsförvalltning", StringComparison.OrdinalIgnoreCase))
                        {
                            userSchools.Add(user.Office);
                        }

                        foreach (var school in currentSchools)
                        {
                            if (string.IsNullOrWhiteSpace(school.Name))
                                continue;

                            if (user.Office.Contains(school.Name, StringComparison.OrdinalIgnoreCase))
                            {
                                userSchools.Add(school.Name);
                            }
                        }
                    }
                }

                permissions.Managers = [.. userManagers.OrderBy(x => x, StringComparer.OrdinalIgnoreCase)];
                permissions.Politicians = [.. userPoliticians.OrderBy(x => x, StringComparer.OrdinalIgnoreCase)];
                permissions.Schools = [.. userSchools.OrderBy(x => x, StringComparer.OrdinalIgnoreCase)];
            }

            user.Permissions = permissions;
        }

        List<User> users = [.. usersByUsername.Values];

        await _localFileService.EncrypteToFile(users.OrderBy(o => o.DisplayName)?.ToList(), "catalogs/moderators");
        #endregion
    }

    public async Task<User?> GetUserFromFile(string username)
    {
        List<UserViewModel> moderators = await _localFileService.GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];
        UserViewModel? moderator = moderators?.FirstOrDefault(x => x.Username == username);
        return moderator;
    }

    public async Task<List<Manager>> GetUsersManagers(string username, string groupName)
    {
        var user = await GetUserFromFile(username);
        return user!.Managers.Where(x => !x.Disabled).ToList() ?? [];
    }

    // Usersr filter
    public async Task<List<User>> Filter(List<User> users, string? groupName, string? username)
    {
        if (string.IsNullOrEmpty(groupName) || string.IsNullOrEmpty(username)) return users;

        var userCahcedData = await GetUserFromFile(username);
        var permissions = userCahcedData?.Permissions ?? new();

        if (!groupName.Equals("Students", StringComparison.OrdinalIgnoreCase))
        {
            users = [.. users.Where(x => permissions.Managers.Contains(x.Manager, StringComparer.OrdinalIgnoreCase))];
            foreach (var user in users)
                user.Managers = _provider.GetUserManagers(user);
        }
        else
            users = [.. users.Where(x => permissions.Schools.Contains(x.Office, StringComparer.OrdinalIgnoreCase))];

        return users;
    }

    #region Help methods
    private static string? ExtractManagerName(string? managerDistinguishedName)
    {
        if (string.IsNullOrWhiteSpace(managerDistinguishedName))
            return null;

        string value = managerDistinguishedName.Trim();

        const string commonNamePrefix = "CN=";

        if (!value.StartsWith(
                commonNamePrefix,
                StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        int commaIndex = value.IndexOf(',');

        if (commaIndex <= commonNamePrefix.Length)
            return null;

        return value[commonNamePrefix.Length..commaIndex].Trim();
    }
    #endregion
}
