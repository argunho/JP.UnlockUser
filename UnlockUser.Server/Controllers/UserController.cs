using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using System.Diagnostics;
using System.DirectoryServices;
using System.Globalization;
using System.Net;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Moderator,ITGroup,DevelopTeam,KCGroup")]
public class UserController(IADService provider, IWebHostEnvironment env,
    ILocalFileService localFileService, IHelpService helpService, IConfiguration config, ILocalUserService localUserService, IMemoryCache memoryCahce,
    ICredentialsService credinalService, ILocalMailService localMailService, IGoogleService googleService, DashboardService dashboard, ILogger<UserController> logger) : ControllerBase
{

    private readonly IADService _provider = provider;
    private readonly IConfiguration _config = config;
    private readonly IHelpService _helpService = helpService;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IWebHostEnvironment _env = env;
    private readonly IMemoryCache _memoryCache = memoryCahce;
    private readonly ILocalUserService _localUserService = localUserService;
    private readonly ICredentialsService _credentialsService = credinalService;
    private readonly ILocalMailService _localMailService = localMailService;
    private readonly IGoogleService _googleService = googleService;
    private readonly DashboardService _dashboard = dashboard;
    private readonly ILogger<UserController> _logger = logger;

    #region GET
    // Get user information by username
    [HttpGet("by/{group}/{key}")]
    public async Task<IActionResult> GetUserForPasswordManage(string group, string key)
    {
        try
        {
            UserViewModel? user = null;
            if (_memoryCache.TryGetValue(
                $"{group}:{_credentialsService.GetClaim("username")}",
                out List<UserViewModel>? cached) || group == "Studenter")
            {
                user = cached?.FirstOrDefault(x => x.Username == key)
                                ?? cached?.FirstOrDefault(x => x.Email == key);
                return Ok(user);
            }

            //var (user, continueSearch) = await GetUserFromCache(key, group);
            //if (user == null || group == "Studenter")

            // Search in AD
            var groupName = "Employees";
            DirectorySearcher? members = _provider.GetMembers(groupName);

            members.Filter = $"(&(objectClass=User)(|(cn={key})(sAMAccountname={key})))";

            var claims = _credentialsService.GetClaims(["roles", "permissions"]);

            if (members.FindOne() != null)
            {
                user = new UserViewModel((_provider.GetUsers(members, group)).FirstOrDefault()!);
                if ((user == null))
                {
                    return NotFound(_helpService.NotFound("Användaren"));
                }
                else if (!claims!["roles"].Contains("Suppport", StringComparison.OrdinalIgnoreCase)
                        && ((await _localUserService.Filter([user], groupName, claims!["permissions"]))?.Count == 0))
                {
                    return Ok(_helpService.Warning($"Du saknar behörigheter att ändra lösenord till {user.DisplayName}!"));
                }

                if (_provider.MembershipCheck(_provider.FindUser(key), "Password Twelve Characters"))
                    user!.PasswordLength = 12;
            }
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpGet("saved/{username}")]
    [Authorize(Roles = "ITGroup,DevelopTeam")]
    public async Task<IActionResult> GetCachedUser(string username)
    {
        try
        {
            var user = await _localUserService.GetUserFromFile(username);
            if (user != null)
                return Ok(new UserViewModel(user));

            return NotFound(_helpService.NotFound("Användaren"));
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpGet("by/{key}")]
    [HttpGet("by/{key}/search/{search:bool}")]
    [Authorize(Roles = "ITGroup,DevelopTeam,KCGroup")]
    public async Task<IActionResult> GetUserByUsername(string key, bool search = false)
    {
        try
        {
            var collections = _dashboard.GetGroupsCachedUsers();
            if (collections.Count > 0)
            {
                var user = collections.FirstOrDefault(x => x.Username == key)
                                ?? collections.FirstOrDefault(x => x.Email == key);
                if (user != null)
                {
                    if (user.Permissions?.Groups.Count == 0 || search)
                        collections = [];

                    if (!search)
                    {
                        List<ViewModel?>? moderators = [.. (await _localFileService.GetEncryptedFile<List<User>>("catalogs/moderators") ?? [])
                                .Where(x => !string.Equals(x.Username, user!.Username, StringComparison.OrdinalIgnoreCase)
                                            && x != null && x.Manager != null && string.Equals(x.Manager, user?.Manager, StringComparison.OrdinalIgnoreCase)
                                            && x.Permissions != null && x.Permissions.Groups.Contains(user?.Group, StringComparer.OrdinalIgnoreCase))
                         .Select(s => new ViewModel
                         {
                             Id = s.Username,
                             Primary = s.DisplayName,
                             Secondary = $"{s.Office} > {(s.Department == s.Office ? s.Division : s.Department)}"
                         }) ?? []]; ;

                        return Ok(new { user, moderators, collections  });
                    }

                    return Ok(user);
                }
            }

            var userPrincipal = _provider.FindUser(key);
            if (userPrincipal == null)
                return NotFound(_helpService.NotFound("Användaren"));

            var cachedUser = await _localUserService.GetUserFromFile(key);
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

            return Ok(new { user = modifiedUser, collections });
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpGet("groups")]
    [Authorize(Roles = "DevelopTeam,ITGroup")]
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
            List<SchoolViewModel> schools = [];
            List<ViewModel> managers = [];
            var username = _credentialsService.GetClaim("username");
            var user = await _localUserService.GetUserFromFile(username!);
            if (user == null)
                return Ok(new { schools, managers });

            schools = [.. (await _localFileService.GetEncryptedFile<List<SchoolViewModel>>("catalogs/schools"))?
                         .Where(x => (bool)(user.Permissions?.Schools.Contains(x.Name, StringComparer.OrdinalIgnoreCase))!) ?? []];

            var managersNames = user.Permissions?.Managers;
            managers = [.. (await _localFileService.GetEncryptedFile<List<Manager>>("catalogs/managers"))
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
    [HttpPost("reset/single/password")]
    [Authorize(Roles = "Moderator")] // Reset password
    public async Task<IActionResult> SetSinglePassword(UserFormModel model)
    {
        try
        {
            EnsureNotImpersonating(); // 2026-09-08

            List<UserFormModel> models = [model];

            if (model.IsEmployee)
                await SetPasswords(models);
            else
                await StudentsPasswordChenge(models);

            return Ok(new { color = "success", success = true, msg = "Lösenordsåterställningen lyckades!" });
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpPost("reset/multiple/passwords")] // Reset class students passwords
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> SetMultiplePasswords(List<UserFormModel> models)
    {
        try
        {
            EnsureNotImpersonating(); // 2026-09-08

            await StudentsPasswordChenge(models);

            return Ok(new { color = "success", success = true, msg = "Lösenordsåterställningen lyckades!" });
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpPost("reset/send/passwords")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> SetPasswordsSavePdf([FromForm] IFormFile file, [FromForm] string data, [FromForm] string label)
    {
        try
        {
            EnsureNotImpersonating(); // 2026-09-08

            data = Uri.UnescapeDataString(data);
            List<UserFormModel>? models = System.Text.Json.JsonSerializer.Deserialize<List<UserFormModel>>(
                data,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            await StudentsPasswordChenge(models);

            if (file != null && file.Length > 0)
            {
                // Implementation of MailRepository class where email content is structured and SMTP connection with credentials
                var claims = _credentialsService.GetClaims(["email", "displayname"]) ?? [];

                await _localMailService.SendMail([claims["email"]], file!.FileName.Replace(".pdf", ""),
                            $"Hej {claims["displayname"]}!<br/> Här bifogas PDF document filen med nya lösenord till elever från {label}.", file);
            }
            else
                return Ok(_helpService.Warning("Lösenordsåterställningen lyckades utan att skicka pdf filen till e-postadress."));

            return Ok(new { color = "success", success = true, msg = "Lösenordsåterställningen lyckades!" });
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex));
        }
    }
    #endregion

    #region PUT
    [HttpPut("unlock/{username}")] // Unlock user
    [Authorize(Roles = "DevelopTeam,Moderator,ITGroup")]
    public async Task<IActionResult> UnlockUser(string username)
    {
        try
        {
            var message = _provider.UnlockUser(username);
            if (message.Length > 0)
                return Ok(_helpService.Warning(message));

            // Save/Update statistics
            await SaveUpdateStatistics("Unlocked", 1);

            return Ok(new { success = true, color = "success", msg = "Användaren har låsts upp!" });
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
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

    // start: 2026-09-08
    // Blocks password changes while a Developer is viewing the app as another
    // moderator (see AuthenticationController.LoginAs) - checked at the top of every
    // password-reset action, since StudentsPasswordChenge swallows exceptions from
    // SetPasswords and would otherwise still call _googleService.UpdatePaswords.
    private void EnsureNotImpersonating()
    {
        if (!string.IsNullOrEmpty(_credentialsService.GetClaim("impersonating")))
            throw new Exception("Lösenordsändring är inte tillåten i granskningsläge.");
    }
    // end

    // Set multiple passwords
    private async Task SetPasswords(List<UserFormModel> models)
    {
        // Check model is valid or not and return warning is true or false
        var userModel = models[0] ?? throw new Exception("Person för lösenordsåterställning har inte specificerats.");

        // If password needs to confirm
        if (!string.IsNullOrEmpty(userModel.ConfirmPassword)
            && !string.Equals(userModel.Password, userModel.ConfirmPassword))
            throw new Exception("Lösenord och bekräftelse av lösenord matchar inte.");

        // Current moderator claims
        var claims = _credentialsService.GetClaims(["groups", "roles", "username"]);
        claims!.TryGetValue("username", out string? username);

        // Managed user credentials
        string? group = userModel.GroupName;
        string? office = userModel.Office;
        string? department = userModel.Department;

        // Check permission for the managed users group
        var groups = claims != null && claims.TryGetValue("groups", out var g) && !string.IsNullOrEmpty(g)
                        ? g.Split(',', StringSplitOptions.RemoveEmptyEntries) : [];

        if (!groups.Contains(group, StringComparer.OrdinalIgnoreCase))
            throw new Exception("Behörigheter saknas!"); // Warning!

        // Check current moderators role
        var roles = claims != null && claims.TryGetValue("roles", out var r) && !string.IsNullOrEmpty(r)
                                ? r.Split(',', StringSplitOptions.RemoveEmptyEntries) : [];

        // Check current user permission
        if (!roles.Contains("ITGroup", StringComparer.OrdinalIgnoreCase))
        {
            var moderators = await _localFileService.GetEncryptedFile<List<User>>("catalogs/moderators");
            var permissions = moderators?.FirstOrDefault(x => x.Username != null
                            && x.Username.Equals(username, StringComparison.OrdinalIgnoreCase))?.Permissions;

            var approvedEmployees = await _localFileService.GetEncryptedFile<List<ApprovedEmployeeViewModel>>("catalogs/approved-employees") ?? [];
            var approvedForCurrentModerator = approvedEmployees.Where(x => x.Moderators!.Contains(username!))?.Select(s => s.Username)?.ToList();

            bool isModerator = moderators!.Exists(x => x.Username!.Equals(userModel.Username, StringComparison.OrdinalIgnoreCase));
            bool isApproved = approvedForCurrentModerator!.Contains(userModel.Username, StringComparer.OrdinalIgnoreCase);

            string warningMessage = "Du saknar behörigheter att ändra lösenord för";
            if (group!.Equals("Studenter", StringComparison.OrdinalIgnoreCase) &&
                !permissions!.Schools.Any(s => office!.StartsWith(s, StringComparison.OrdinalIgnoreCase)))
            {
                throw new Exception($"{warningMessage} {department} {office}");
            }
            else if ((string.IsNullOrEmpty(userModel.Manager) || isModerator) && !isApproved)
            {
                throw new Exception($"{warningMessage} {userModel.Username}");
            }
            else
            {
                var match = Regex.Match(userModel.Manager!, @"^CN=([^,]+)");
                string? userManager = match.Success ? match.Groups[1]?.Value : null;

                if (string.IsNullOrEmpty(userManager) || (!permissions!.Managers.Contains(userManager, StringComparer.OrdinalIgnoreCase)
                    && !userManager.Equals(username, StringComparison.OrdinalIgnoreCase)))
                    throw new Exception($"{warningMessage} {userModel.Username}");
            }
        }

        _logger.LogInformation("Password change initiated at {dateTime}. Moderator: {user}", DateTime.Now.ToString("g"), username);

        Data history = await GetLogData(group!, office!, department!);
        var message = new StringBuilder();

        _logger.LogInformation("Permissions validated. Starting to set a new password for {users} at {dateTime}.",
            string.Join(",", models.Select(s => s.Username).ToList()), DateTime.Now.ToString("g"));

        // Set password to class students
        foreach (var user in models!)
        {
            // Most relevant for students
            if (string.IsNullOrEmpty(user.Username))
            {
                var userData = _provider.FindUser(user.Email!);
                user.Username = userData?.SamAccountName;
            }

            _provider.ResetPassword(user);
            if (_env.IsProduction())
                history.Users.Add(user?.Username ?? "");
        }

        // Save/Update statistics
        if (!userModel.Check && _env.IsProduction())
        {
            _ = Task.Run(async () =>
            {
                await SaveHistoryLogFile(history);
                await SaveUpdateStatistics("PasswordsChange", models.Count);
            });
        }

        _logger.LogInformation("Password change finished at {dateTime}. Moderator: {user}", DateTime.Now.ToString("g"), username);
    }

    private async Task StudentsPasswordChenge(List<UserFormModel> models)
    {
        try
        {
            await SetPasswords(models);
        }
        catch (Exception ex)
        {
            _logger.LogError($"{nameof(SetPasswordsSavePdf)}. Error: {ex.Message}");
            await _helpService.Error(ex);
        }

        await _googleService.UpdatePaswords(models);
    }

    // Save update statistik
    private async Task SaveUpdateStatistics(string param, int count)
    {
        try
        {
            var year = DateTime.Now.Year;
            var month = DateTime.Now.ToString("MMMM", CultureInfo.InvariantCulture);

            var passChange = (param == "PasswordsChange");

            var statistics = await _localFileService.GetEncryptedFile<List<Statistics>>("catalogs/statistics") ?? [];
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

            await _localFileService.EncrypteToFile(statistics, "catalogs/statistics");
        }
        catch (Exception ex)
        {
            _logger.LogError("Unable to save the statistics file! Error: {error}", ex.Message);
            await _helpService.Error(ex);
        }
    }

    // Save log file
    private async Task SaveHistoryLogFile(Data model)
    {
        try
        {
            var user = _provider.FindUser(_credentialsService.GetClaim("username") ?? "");
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
                var managedUser = _provider.FindUser(model!.Users[0]);
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

            var histories = await _localFileService.GetEncryptedFile<List<FileViewModel>>("catalogs/histories") ?? [];
            FileViewModel hitoryData = new()
            {
                Name = $"{model!.Group}  {model.Office}",
                Description = description.ToString()
            };

            histories.Add(hitoryData);
            await _localFileService.EncrypteToFile(histories, "catalogs/histories");
        }
        catch (Exception ex)
        {
            _logger.LogError("Unable to save the history file! Error: {error}", ex.Message);
            await _helpService.Error(ex);
        }
    }
    #endregion
}