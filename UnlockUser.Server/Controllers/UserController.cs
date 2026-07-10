using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using System.Diagnostics;
using System.DirectoryServices;
using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Json;
using UnlockUser.Server.FormModels;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UserController(IActiveDirectory provider, IWebHostEnvironment env,
    ILocalFileService localFileService, IHelpService helpService, IConfiguration config, ILocalUserService localService, IMemoryCache memoryCahce,
    ICredentialsService credinalService, ILocalMailService localMailService, ILogger<UserController> logger) : ControllerBase
{

    private readonly IActiveDirectory _provider = provider;
    private readonly IConfiguration _config = config;
    private readonly IHelpService _helpService = helpService;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IWebHostEnvironment _env = env;
    private readonly IMemoryCache _memoryCache = memoryCahce;
    private readonly ILocalUserService _localService = localService;
    private readonly ICredentialsService _credentialsService = credinalService;
    private readonly ILocalMailService _localMailService = localMailService;
    private readonly ILogger<UserController> _logger = logger;

    #region GET
    // Get user information by username
    [HttpGet("by/{group}/{name}")]
    public async Task<IActionResult> GetUserForPasswordManage(string group, string name)
    {
        try
        {
            var (user, continueSearch) = await GetUserFromCache(group, name);
            if (!continueSearch)
                return Ok(user);

            var groupName = group == "Studenter" ? "Students" : "Employees";
            DirectorySearcher? members = _provider.GetMembers(groupName);

            members.Filter = $"(&(objectClass=User)(|(cn={name})(sAMAccountname={name})))";

            var claims = _credentialsService.GetClaims(["roles", "permissions"]);

            if (members.FindOne() != null)
            {
                user = new UserViewModel((_provider.GetUsers(members, group)).FirstOrDefault()!);
                if ((user == null))
                {
                    return NotFound(_helpService.NotFound("Användaren"));
                }
                else if (!claims!["roles"].Contains("Suppport", StringComparison.OrdinalIgnoreCase)
                        && ((await _localService.Filter([user], groupName, claims!["permissions"]))?.Count == 0))
                {
                    return Ok(_helpService.Warning($"Du saknar behörigheter att ändra lösenord till {user.DisplayName}!"));
                }

                if (_provider.MembershipCheck(_provider.FindUserByUsername(name), "Password Twelve Characters"))
                    user!.PasswordLength = 12;
            }
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    // Get stored  employees who have permission to manage employee passwords nby group name
    [HttpGet("catalogs")]
    public async Task<IActionResult> GetUsersByGroupName()
    {
        try
        {

            // Saved employees who have permission to manage employee passwords
            var moderators = await _localFileService.GetListFromEncryptedFile<UserViewModel>("catalogs/moderators") ?? [];
            var managers = await _localFileService.GetListFromEncryptedFile<Manager>("catalogs/managers") ?? [];
            var politicians = (await _localFileService.GetListFromEncryptedFile<User>("catalogs/politicians")).Select(s => new UserViewModel(s)) ?? [];
            var approvedEmployees = await _localFileService.GetListFromEncryptedFile<ApprovedEmployeeViewModel>("catalogs/approved-employees") ?? [];
            var groups = _config.GetSection("Groups").Get<List<GroupModel>>()?.Select(s => s.Name).ToList();

            return Ok(new { moderators, managers, politicians, approvedEmployees, groups });
        }
        catch (Exception ex)
        {
            await _helpService.Error(ex);
            return Ok();
        }
    }

    [HttpGet("saved/{username}")]
    [Authorize(Roles = "Moderator, DevelopTeam")]
    public async Task<IActionResult> GetCachedUser(string username)
    {
        try
        {
            var user = await _localService.GetUserFromFile(username);
            if (user != null)
                return Ok(new UserViewModel(user));

            return NotFound(_helpService.NotFound("Användaren"));
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpGet("by/{username}")]
    [Authorize(Roles = "Moderator, DevelopTeam")]
    public async Task<IActionResult> GetUserByUsername(string username)
    {
        try
        {
            var collection = new List<UserViewModel>();
            var (user, continueSearch) = await GetUserFromCache("support", username);
            if (!continueSearch)
            {
                if (user != null && user.Permissions?.Groups.Count > 0)
                    collection = GetGroupsCachedUsers();

                return Ok(new { user, collection });
            }

            var userPrincipal = _provider.FindUserByUsername(username);
            if (userPrincipal == null)
                return NotFound(_helpService.NotFound("Användaren"));

            var cachedUser = await _localService.GetUserFromFile(username);
            var modifiedUser = new UserViewModel(new User
            {
                Username = userPrincipal.SamAccountName,
                DisplayName = userPrincipal.DisplayName,
                Title = userPrincipal.Title,
                Email = userPrincipal.EmailAddress,
                Office = userPrincipal.Office,
                Department = userPrincipal.Department,
                Division = userPrincipal.Division,
                Manager = userPrincipal.Manager,
                IsLocked = userPrincipal.AccountLockoutTime != null,
                Permissions = cachedUser != null ? cachedUser?.Permissions : null
            });

            if (userPrincipal.DistinguishedName!.Contains("OU=Employees", StringComparison.OrdinalIgnoreCase))
            {
                var userByGroups = _provider.GetSecurityGroupMembers("Ciceron-Assistentanvändare");
                if (userByGroups != null && userByGroups.FirstOrDefault(x => x == userPrincipal.SamAccountName) != null)
                    modifiedUser.Group = "Politeker";
                else
                    modifiedUser.Group = "Personal";
            }
            else
                modifiedUser.Group = "Stundeter";


            return Ok(new { user = modifiedUser, collection });
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpGet("groups")]
    [Authorize(Roles = "DevelopTeam,Manager,Moderator")]
    public List<string?> GetGrous()
    {
        var groups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];
        if (groups.Count > 0)
            return [.. groups.Select(x => x.Name)];

        return [];
    }

    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions()
    {
        try
        {
            List<School> schools = [];
            List<ViewModel> managers = [];
            var username = _credentialsService.GetClaim("username");
            var user = await _localService.GetUserFromFile(username!);
            if (user == null)
                return Ok(new { schools, managers });

            schools = [.. (await _localFileService.GetListFromEncryptedFile<School>("catalogs/schools"))?
                         .Where(x => (bool)(user.Permissions?.Schools.Contains(x.Name, StringComparer.OrdinalIgnoreCase))!) ?? []];

            var managersNames = user.Permissions?.Managers;
            managers = [.. (await _localFileService.GetListFromEncryptedFile<Manager>("catalogs/managers"))
                                .Where(x => managersNames!.Contains(x.Username, StringComparer.OrdinalIgnoreCase))
                         .Select(s => new ViewModel
                         {
                             Id = s.Username,
                             Primary = s.Office,
                             Secondary = s.Department == s.Office ? s.Division : s.Department
                         }) ?? []];

            return Ok(new { groups = user.Permissions?.Groups, schools, managers });
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }
    #endregion

    #region POST
    [HttpPost("reset/single/password")] // Reset password
    public async Task<IActionResult> SetSinglePassword(UserFormModel model)
    {
        try
        {
            var res = await SetPasswords([model]);
            if (string.IsNullOrEmpty(res))
                return Ok(new { color = "success", success = true, msg = "Lösenordsåterställningen lyckades!" });

            return BadRequest(_helpService.Warning(res));
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpPost("reset/multiple/passwords")] // Reset class students passwords
    public async Task<IActionResult> SetMultiplePasswords(List<UserFormModel> models)
    {
        try
        {
            var res = await SetPasswords(models);
            if (string.IsNullOrEmpty(res))
                return Ok(new { color = "success", success = true, msg = "Lösenordsåterställningen lyckades!" });

            return BadRequest(_helpService.Warning(res));
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpPost("reset/send/passwords")]
    public async Task<IActionResult> SetPasswordsSavePdf([FromForm] IFormFile file, [FromForm] string data, [FromForm] string label)
    {
        try
        {
            bool isFileEmpty = (file == null || file.Length == 0);
            data = Uri.UnescapeDataString(data);
            List<UserFormModel>? models = System.Text.Json.JsonSerializer.Deserialize<List<UserFormModel>>(
                data,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            var res = await SetPasswords(models!);
            if (string.IsNullOrEmpty(res) && !isFileEmpty)
            {
                // Implementation of MailRepository class where email content is structured and SMTP connection with credentials
                var claims = _credentialsService.GetClaims(["email", "displayname"]) ?? [];
                var pass = _helpService.DecodeFromBase64("HashedCredential").Replace(_config["JwtSettings:Key"]!, "") ?? "";
                var success = _localMailService.SendMail(claims["email"], file!.FileName.Replace(".pdf", ""),
                            $"Hej {claims["displayname"]}!<br/> Här bifogas PDF document filen med nya lösenord till elever från {label}.",
                            claims["email"], pass, file);

                return Ok(new { color = "success", success = true, msg = "Lösenordsåterställningen lyckades!" });
            }


            return BadRequest(_helpService.Warning(res));
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpPost("renew/saved")]
    [Authorize(Roles = "DevelopTeam,Manager,Moderator")]
    public async Task<IActionResult> RenewSavedEmployeesList()
    {
        try
        {
            await _localService.RenewUsersCachedList();
            _localFileService.UpdateConfigFile("appconfig", "LastUpdatedDate", DateTime.Now.ToString("yyyy.MM.dd HH:mm:ss"));
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }
    #endregion

    #region PUT
    [HttpPut("unlock/{username}")] // Unlock user
    public async Task<IActionResult> UnlockUser(string username)
    {
        try
        {
            var message = _provider.UnlockUser(username);
            if (message.Length > 0)
                return Ok(_helpService.Warning(message));

            // Save/Update statistics
            await SaveUpdateStatitics("Unlocked", 1);

            return Ok(new { success = true, color = "success", msg = "Användaren har låsts upp!" });
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpPut("update/permissions/{username}")]
    [Authorize(Roles = "DevelopTeam,Manager,Moderator")]
    public async Task<IActionResult> PutUpdateEmployeeSchool(string username, PermissionsViewModel model)
    {
        try
        {
            var employees = await _localFileService.GetListFromEncryptedFile<UserViewModel>("catalogs/moderators") ?? [];
            var employee = employees.FirstOrDefault(x => x.Username == username);
            if (employee == null)
                return NotFound(_helpService.NotFound("Anställd"));

            model.Managers = [.. model.Managers.OrderBy(x => x)];
            model.Politicians = [.. model.Politicians.OrderBy(x => x)];
            model.Schools = [.. model.Schools.OrderBy(x => x)];

            employee.Permissions = model;
            await _localFileService.SaveUpdateEncryptedFile(employees, "catalogs", "moderators");
            await _localFileService.SaveUpdateEncryptedFile(model.ApprovedEmployees, "catalogs", "approved-employees");
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }

        return Ok(_helpService.Success());
    }
    #endregion

    #region Helpers
    // Return information
    private async Task<Data> GetLogData([FromBody] string group, [FromBody] string office, [FromBody] string department)
    {
        var ip = Request.HttpContext.Connection.RemoteIpAddress?.ToString();

        // Get computer name
        string pcName = "Unknown";

        try
        {
            if (IPAddress.TryParse(ip, out var addr))
                pcName = (await Dns.GetHostEntryAsync(addr))
                    .HostName
                    .Split('.', StringSplitOptions.RemoveEmptyEntries)
                    .FirstOrDefault() ?? pcName;
        }
        catch { }

        //IPHostEntry GetIPHost = Dns.GetHostEntry(IPAddress.Parse(ip!));
        //List<string> compName = [.. GetIPHost.HostName.ToString().Split('.')];
        //string pcName = compName.First();
        //string computerName = (Environment.MachineName ?? System.Net.Dns.GetHostName() ?? Environment.GetEnvironmentVariable("COMPUTERNAME"));

        var claims = _credentialsService.GetClaims(["office", "department"]) ?? [];
        var data = new Data();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        if (string.IsNullOrEmpty(ipAddress))
        {
            var ipHeader = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            ipAddress = ipHeader?.Split(',').First().Trim();
        }

        try
        {
            data = new()
            {
                Office = claims["office"],
                Department = claims?["department"] ?? null,
                ManagedUserOffice = office,
                ManagedUserDepartment = department,
                Group = group,
                ComputerName = pcName,
                IpAddress = ipAddress
            };
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
        }

        return data;
    }

    // Set multiple passwords
    private async Task<string?> SetPasswords(List<UserFormModel> userModels)
    {
        var userModel = userModels[0];
        // Check model is valid or not and return warning is true or false
        if (userModel == null)
            return "Person för lösenordsåterställning har inte specificerats."; // Password reset user not specified

        // CUrrent moderator claims
        var claims = _credentialsService.GetClaims(["groups", "roles", "username", "permissions"]);
        if (claims == null || userModels == null)
            return "Ingen användare med behörighet för lösenordsåterställning har specificerats.";

        claims!.TryGetValue("username", out string? username);

        // If password needs to confirm
        if (!string.IsNullOrEmpty(userModel.ConfirmPassword))
        {
            if (!string.Equals(userModel.Password, userModel.ConfirmPassword))
                return "Lösenord och bekräftelse av lösenord matchar inte.";
        }

        // Managed user credentials
        string? group = userModel.GroupName;
        string? office = userModel.Office;
        string? department = userModel.Department;


        // Check permission for the managed users group
        var groups = claims != null && claims.TryGetValue("groups", out var g) && !string.IsNullOrEmpty(g)
                        ? g.Split(',', StringSplitOptions.RemoveEmptyEntries) : [];

        if (!groups.Contains(group, StringComparer.OrdinalIgnoreCase))
            return "Behörigheter saknas!"; // Warning!

        // Check current moderators role
        var roles = claims != null && claims.TryGetValue("roles", out var r) && !string.IsNullOrEmpty(r)
                                ? r.Split(',', StringSplitOptions.RemoveEmptyEntries) : [];

        _logger.LogInformation("Password change initiated at {dateTime}. Moderator: {user}", DateTime.Now.ToString("g"), username);
        _logger.LogInformation("Permission validation for the admin role.");

        // Check current user permission
        if (roles.Contains("Moderator", StringComparer.OrdinalIgnoreCase))
        {
            var permissionsJson = HttpContext.Session.GetString("permissions");

            var permissions = permissionsJson is null
                ? null
                : JsonConvert.DeserializeObject<PermissionsViewModel>(permissionsJson);

            string warningMessage = "Du saknar behörigheter att ändra lösenord till";
            if (group!.Equals("Students", StringComparison.OrdinalIgnoreCase))
            {
                if (!permissions!.Schools.Contains(office, StringComparer.OrdinalIgnoreCase))
                    return $"{warningMessage} {department} {office}";
            }
            else
            {
                var manager = userModel.Manager;

                string? userManager = (!string.IsNullOrEmpty(manager) && manager.Contains(',')) ? manager.Trim()?[3..manager!.IndexOf(',')] : null;

                if (string.IsNullOrEmpty(userManager) || (!permissions!.Managers.Contains(userManager, StringComparer.OrdinalIgnoreCase)
                    && !userManager.Equals(username, StringComparison.OrdinalIgnoreCase)))
                    return $"{warningMessage} {userModel.Username}";
            }
        }

        Data sessionUserData = await GetLogData(group!, office!, department!);
        var message = new StringBuilder();


        _logger.LogInformation("Permissions validated. Starting to set a new password for {users} at {dateTime}.", string.Join(",", userModels), DateTime.Now.ToString("g"));

        // Set password to class students
        foreach (var user in userModels!)
        {
            try
            {
                _provider.ResetPassword(user);
                if (_env.IsProduction())
                    sessionUserData.Users.Add(user?.Username ?? "");
            }
            catch (Exception ex)
            {
                _logger.LogError("Failed to change the password for {person}.", user.Username);
                message?.Append($"Fel vid försök ändra lösenord till {user.Username}: {ex.Message}");
            }
        }

        // Save/Update statistics
        if (!userModel.Check && _env.IsProduction())
        {
            _ = Task.Run(async () =>
            {
                await SaveHistoryLogFile(sessionUserData);
                await SaveUpdateStatitics("PasswordsChange", userModels.Count);
            });
        }

        _logger.LogInformation("Password change finished at {dateTime}. Moderator: {user}", DateTime.Now.ToString("g"), username);
        return (message?.Length > 0) ? message.ToString() : null;
    }

    private async Task<(UserViewModel?, bool)> GetUserFromCache(string group, string name)
    {
        var groupModels = new List<UserViewModel>();
        var username = _credentialsService.GetClaim("username");

        var id = HttpContext.Session.Id;
        if (_memoryCache.TryGetValue(
            $"groups_{id}",
            out Dictionary<string, List<UserViewModel>>? cachedGroups))
        {
            bool supportModel = string.Equals(group.ToString(), "Support", StringComparison.OrdinalIgnoreCase);
            if (supportModel)
            {
                List<string?> groups = [.. _config.
                   GetSection("Groups")
                   .Get<List<GroupModel>>()?
                   .Select(s => s.Name)!
                   .Where(x => !string.IsNullOrWhiteSpace(x))
                   .Cast<string>()!
                 ];

                groupModels = [.. groups.SelectMany(g => cachedGroups!.TryGetValue(g.ToLower(), out var value) ? value : [])];
            }
            else
            {
                groupModels = cachedGroups!.TryGetValue(group.ToLower(), out var value) ? value : [];
            }

            var user = groupModels.FirstOrDefault(x => x.Username == name);
            return (user, false);
        }

        return (null, true);
    }

    private List<UserViewModel> GetGroupsCachedUsers()
    {
        var id = HttpContext.Session.Id;
        if (_memoryCache.TryGetValue(
            $"groups_{id}",
            out Dictionary<string, List<UserViewModel>>? cachedGroups))
        {
            List<string?> groups = [.. _config.
                   GetSection("Groups")
                   .Get<List<GroupModel>>()?
                   .Select(s => s.Name)!
                   .Where(x => !string.IsNullOrWhiteSpace(x))
                   .Cast<string>()!];

            return [.. groups.SelectMany(g => cachedGroups!.TryGetValue(g.ToLower(), out var value) ? value : [])];
        }
        else
            return [];
    }

    // Save update statistik
    private async Task SaveUpdateStatitics(string param, int count)
    {
        var year = DateTime.Now.Year;
        var month = DateTime.Now.ToString("MMMM", CultureInfo.InvariantCulture);

        var passChange = (param == "PasswordsChange");

        var statistics = await _localFileService.GetListFromEncryptedFile<Statistics>("catalogs/statistics");
        var yearStatistics = statistics.FirstOrDefault(x => x.Year == year);

        var newData = new Months
        {
            Name = month,
            PasswordsChange = passChange ? count : 0,
            Unlocked = passChange ? 0 : count
        };

        if (yearStatistics != null)
        {
            var monthStatistics = yearStatistics.Months.FirstOrDefault(x => x.Name == month);
            if (monthStatistics != null)
            {
                if (passChange)
                    monthStatistics.PasswordsChange += count;
                else
                    monthStatistics.Unlocked += count;
            }
            else
                yearStatistics.Months.Add(newData);
        }
        else
        {
            statistics.Add(new Statistics
            {
                Year = year,
                Months = [newData]
            });
        }

        await _localFileService.SaveUpdateEncryptedFile(statistics, "catalogs", "statistics");
    }

    // Save log file
    private async Task SaveHistoryLogFile(Data model)
    {
        var user = _provider.FindUserByUsername(_credentialsService.GetClaim("username") ?? "");
        if (user == null)
            return;

        var description = new StringBuilder();
        description.Append("\r Anställd");
        description.Append($"\n - Användarnamn: {user?.Name}");
        description.Append($"\n - Namn: {user?.DisplayName}");
        description.Append($"\n - E-postadress: {user?.EmailAddress}");
        description.Append($"\n - Arbetsplats: {user.Department}");
        description.Append($"\n - Tjänst: {user.Title}");
        description.Append($"\n\n\r Dator");
        description.Append($"\n - Datornamn: {model?.ComputerName}");
        description.Append($"\n - IpAddress: {model?.IpAddress}");
        description.Append($"\n\n\r Hantering");
        description.Append($"\n - Gruppnamn: {model?.Group}");
        description.Append($"\n - ");
        description.Append($"\n - ");

        bool isStudentGroup = string.Equals(model!.Group, "studenter", StringComparison.OrdinalIgnoreCase);

        if (isStudentGroup)
        {
            description.Append($" - Skolan: {model?.ManagedUserOffice}");
            description.Append($" - Klassnamn: {model?.ManagedUserDepartment}");
            description.Append($"\n\n\r Lösenord ändrad till {model?.Users.Count} student{(model?.Users.Count > 1 ? "er" : "")}:");
            foreach (var student in model!.Users)
                description.Append($"\n\t- Student: {student}");
        }
        else
        {
            var managedUser = _provider.FindUserByUsername(model!.Users[0]);
            if (managedUser != null)
            {
                model.Office = user.Office;
                model.Department = user.Department;
            }
            description.Append($" - Arbetsplats: {model?.Office}");
            description.Append($"\n\n\r Lösenord ämdrad till:");
            description.Append($"\n\t-{model?.Group}: {model?.Users[0]}");
        }
        description.Append("\n\n\n Datum: " + DateTime.Now.ToString("yyyy.MM.dd HH:mm:ss"));

        var histories = await _localFileService.GetListFromEncryptedFile<FileViewModel>("catalogs/histories");
        FileViewModel hitoryData = new()
        {
            Name = $"{model!.Group}  {model.Office}",
            Description = description.ToString()
        };

        histories.Add(hitoryData);
        await _localFileService.SaveUpdateEncryptedFile(histories, "catalogs", "histories");
    }
    #endregion
}

//// Set multiple passwords
//private async Task<string?> SetPassword(UserFormModel user)
//{
//    // Check model is valid or not and return warning is true or false
//    if (user == null)
//        return "Användare för lösenordsåterställning har inte specificerats."; // Password reset user not specified

//    // If password needs to confirm
//    if (!string.IsNullOrEmpty(user.ConfirmPassword))
//    {
//        if (!string.Equals(user.Password, user.ConfirmPassword))
//            return "Lösenord och bekräftelse av lösenord matchar inte.";
//    }

//    // Managed user credentials
//    string? group = user.GroupName;
//    string? office = user.Office;
//    string? department = user.Department;

//    // CUrrent moderator claims
//    var claims = _credentialsService.GetClaims(["groups", "roles", "username", "permissions"]);


//    // Check permission for the managed users group
//    var groups = claims != null && claims.TryGetValue("groups", out var g) && !string.IsNullOrEmpty(g)
//                    ? g.Split(',', StringSplitOptions.RemoveEmptyEntries) : [];

//    if (!groups.Contains(group, StringComparer.OrdinalIgnoreCase))
//        return "Behörigheter saknas!"; // Warning!


//    // Check current moderators role
//    var roles = claims != null && claims.TryGetValue("roles", out var r) && !string.IsNullOrEmpty(r)
//                            ? r.Split(',', StringSplitOptions.RemoveEmptyEntries) : [];

//    if (!roles.Contains("Moderator", StringComparer.OrdinalIgnoreCase))
//    {
//        var permissions = JsonConvert.DeserializeObject<PermissionsViewModel>(claims!["permissions"])!;

//        string warningMessage = "Du saknar behörigheter att ändra lösenord till";

//        var manager = user.Manager;

//        string? userManager = (!string.IsNullOrEmpty(manager) && manager.Contains(',')) ? manager.Trim()?[3..manager!.IndexOf(',')] : null;
//        if (string.IsNullOrEmpty(userManager) || !permissions.Managers.Contains(userManager, StringComparer.OrdinalIgnoreCase))
//            return $"{warningMessage} {user.Username}";
//    }

//    Data sessionUserData = await GetLogData(group!, office!, department!);
//    var message = new StringBuilder();

//    // Set password to class students

//    try
//    {
//        _provider.ResetPassword(user);
//        if (_env.IsProduction())
//            sessionUserData.Users.Add(user?.Username ?? "");
//    }
//    catch (Exception ex)
//    {
//        message?.Append($"Fel vid försök ändra lösenord till {user.Username}: {ex.Message}");
//    }


//    // Save/Update statistics
//    if (!user.Check && _env.IsProduction())
//    {
//        await SaveHistoryLogFile(sessionUserData);
//        await SaveUpdateStatitics("PasswordsChange", 1);
//    }

//    return (message?.Length > 0) ? message.ToString() : null;
//}
