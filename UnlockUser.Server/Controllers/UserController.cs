using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    ILocalFileService localFileService, IHelpService helpService, IConfiguration config, ILocalUserService localService,
    ICredentialsService credinalService, ILocalMailService localMailService) : ControllerBase
{

    private readonly IActiveDirectory _provider = provider;
    private readonly IConfiguration _config = config;
    private readonly IHelpService _helpService = helpService;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IWebHostEnvironment _env = env;
    private readonly ILocalUserService _localService = localService;
    private readonly ICredentialsService _credentialsService = credinalService;
    private readonly ILocalMailService _localMailService = localMailService;

    #region GET
    // Get user information by username
    [HttpGet("{group}/{name}")]
    public async Task<IActionResult> GetUserForPasswordManage(string group, string name)
    {
        UserViewModel? user = null; ;
        try
        {
            var groupName = group == "Studenter" ? "Students" : "Employees";
            DirectorySearcher? members = _provider.GetMembers(groupName);

            members.Filter = $"(&(objectClass=User)(|(cn={name})(sAMAccountname={name})))";

            var claims = _credentialsService.GetClaims(["roles", "permission"], Request);

            if (members.FindOne() != null)
            {
                user = new UserViewModel((_provider.GetUsers(members, group)).FirstOrDefault()!);
                if ((user == null))
                {
                    return NotFound(_helpService.NotFound("Användaren"));
                }
                else if (!claims!["roles"].Contains("Suppport", StringComparison.OrdinalIgnoreCase)
                        && ((await _localService.Filter([user], groupName, claims!["permission"]))?.Count == 0))
                {
                    return Ok(_helpService.Warning($"Du saknar behörigheter att ändra lösenord till {user.DisplayName}!"));
                }

                if (_provider.MembershipCheck(_provider.FindUserByUsername(name), "Password Twelve Characters"))
                    user!.PasswordLength = 12;
            }
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }

        return Ok(new { user });
    }

    // Get stored  employees who have permission to manage employee passwords nby group name
    [HttpGet("principal")]
    public async Task<IActionResult> GetUsersByGroupName()
    {
        try
        {
            // Saved employees who have permission to manage employee passwords
            var moderators = await _localFileService.GetListFromEncryptedFile<UserViewModel>("catalogs/moderators") ?? [];
            var managers = await _localFileService.GetListFromEncryptedFile<Manager>("catalogs/managers") ?? [];
            var politicians = (await _localFileService.GetListFromEncryptedFile<User>("catalogs/politicians")).Select(s => new UserViewModel(s)) ?? [];
            return Ok(new { moderators, managers, politicians });
        }
        catch (Exception ex)
        {
            await _helpService.Error(ex);
            return Ok();
        }
    }

    [HttpGet("saved/{username}")]
    [Authorize(Roles = "Support, DevelopTeam")]
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
    [Authorize(Roles = "Support, DevelopTeam")]
    public async Task<IActionResult> GetUserByUsername(string username)
    {
        try
        {
            var user = _provider.FindUserByUsername(username);
            if (user == null)
                return NotFound(_helpService.NotFound("Användaren"));

            var cachedUser = await _localService.GetUserFromFile(username);
            var modifiedUser = new UserViewModel(new User
            {
                Name = user.SamAccountName,
                DisplayName = user.DisplayName,
                Title = user.Title,
                Email = user.EmailAddress,
                Office = user.Office,
                Department = user.Department,
                Division = user.Division,
                Manager = user.Manager,
                IsLocked = user.AccountLockoutTime != null,
                Permissions = cachedUser != null ? cachedUser?.Permissions : null
            });

            if (user.DistinguishedName!.Contains("OU=Employees", StringComparison.OrdinalIgnoreCase))
            {
                var userByGroups = _provider.GetSecurityGroupMembers("Ciceron-Assistentanvändare");
                if (userByGroups != null && userByGroups.FirstOrDefault(x => x == user.SamAccountName) != null)
                    modifiedUser.Group = "Politeker";
                else
                    modifiedUser.Group = "Personal";
            }
            else
                modifiedUser.Group = "Stundeter";

            return Ok(modifiedUser);
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }

    [HttpGet("groups")]
    [Authorize(Roles = "DevelopTeam,Manager,Support")]
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
            var username = _credentialsService.GetClaim("username", Request);
            var user = await _localService.GetUserFromFile(username!);
            if (user == null)
                return NotFound(_helpService.NotFound("Användaren"));

            var schools = (await _localFileService.GetListFromEncryptedFile<School>("catalogs/schools"))?
                         .Where(x => (bool)(user.Permissions?.Schools.Contains(x.Name, StringComparer.OrdinalIgnoreCase))!).ToList();

            var managersNames = user.Permissions?.Managers;
            var managers = (await _localFileService.GetListFromEncryptedFile<Manager>("catalogs/managers"))
                                .Where(x => managersNames!.Contains(x.Username, StringComparer.OrdinalIgnoreCase))
                         .Select(s => new ViewModel
                         {
                             Id = s.Username,
                             Primary = s.Office,
                             Secondary = s.Department == s.Office ? s.Division : s.Department
                         }).ToList();

            return Ok(new { groups = user.Permissions?.Groups, schools, managers });
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error(ex));
        }
    }
    #endregion

    #region POST
    [HttpPost("reset/single/password")] // Reset class students passwords
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
                // Return and download file
                //if (!isFileEmpty)
                //{
                //    using var ms = new MemoryStream();
                //    await file!.CopyToAsync(ms);
                //    var bytes = ms.ToArray();

                //    return File(bytes, "application/pdf", file.FileName.Replace(" ", "_"));
                //}

                // Implementation of MailRepository class where email content is structured and SMTP connection with credentials
                var claims = _credentialsService.GetClaims(["email", "displayname"], Request) ?? [];
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
    [Authorize(Roles = "DevelopTeam,Manager,Support")]
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
    [Authorize(Roles = "DevelopTeam,Manager,Support")]
    public async Task<IActionResult> PutUpdateEmployeeSchool(string username, PermissionsViewModel model)
    {
        try
        {
            var employees = await _localFileService.GetListFromEncryptedFile<UserViewModel>("catalogs/moderators") ?? [];
            var employee = employees.FirstOrDefault(x => x.Name == username);
            if (employee == null)
                return NotFound(_helpService.NotFound("Anställd"));

            model.Managers = [.. model.Managers.OrderBy(x => x)];
            model.Politicians = [.. model.Politicians.OrderBy(x => x)];
            model.Schools = [.. model.Schools.OrderBy(x => x)];

            employee.Permissions = model;
            await _localFileService.SaveUpdateEncryptedFile(employees, "catalogs/moderators");
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

        var claims = _credentialsService.GetClaims(["office", "department"], Request) ?? [];
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
    private async Task<string?> SetPasswords(List<UserFormModel> users)
    {
        // Check model is valid or not and return warning is true or false
        if (users == null || users.Count == 0)
            return "Användare för lösenordsåterställning har inte specificerats."; // Password reset user not specified

        // If password needs to confirm
        if (!string.IsNullOrEmpty(users?[0]?.ConfirmPassword))
        {
            if (!string.Equals(users[0]?.Password, users[0]?.ConfirmPassword))
                return "Lösenord och bekräftelse av lösenord matchar inte.";
        }

        // Managed user credentials
        string? group = users?[0].GroupName;
        string? office = users?[0].Office;
        string? department = users?[0].Department;

        // CUrrent moderator claims
        var claims = _credentialsService.GetClaims(["groups", "roles", "username", "permission"], Request);

        // Check permission for the managed users group
        var groups = claims != null && claims.TryGetValue("groups", out var g) && !string.IsNullOrEmpty(g)
                        ? g.Split(',', StringSplitOptions.RemoveEmptyEntries) : [];
        if (!groups.Contains(group, StringComparer.OrdinalIgnoreCase))
            return "Behörigheter saknas!"; // Warning!


        // Check current moderators role
        var roles = claims != null && claims.TryGetValue("roles", out var r) && !string.IsNullOrEmpty(r)
                                ? r.Split(',', StringSplitOptions.RemoveEmptyEntries) : [];
        if (!roles.Contains("Support", StringComparer.OrdinalIgnoreCase))
        {
            var permissions = JsonConvert.DeserializeObject<PermissionsViewModel>(claims!["permission"])!;

            string warningMessage = "Du saknar behörigheter att ändra lösenord till";
            if (group!.Equals("Students", StringComparison.OrdinalIgnoreCase))
            {
                if (!permissions.Schools.Contains(office, StringComparer.OrdinalIgnoreCase))
                    return $"{warningMessage} {department} {office}";
            }
            else
            {
                var manager = users?[0].Manager;

                string? userManager = (!string.IsNullOrEmpty(manager) && manager.Contains(',')) ? manager.Trim()?[3..manager!.IndexOf(',')] : null;
                if (string.IsNullOrEmpty(userManager) || !permissions.Managers.Contains(userManager, StringComparer.OrdinalIgnoreCase))
                    return $"{warningMessage} {users?[0].Username}";
            }
        }

        Data sessionUserData = await GetLogData(group!, office!, department!);
        var message = new StringBuilder();

        // Set password to class students
        foreach (var user in users!)
        {
            try
            {
                _provider.ResetPassword(user);
                if (_env.IsProduction())
                    sessionUserData.Users.Add(user?.Username ?? "");
            }
            catch (Exception ex)
            {
                message?.Append($"Fel vid försök ändra lösenord till {user.Username}: {ex.Message}");
            }
        }

        // Save/Update statistics
        if (!users[0].Check && _env.IsProduction())
        {
            await SaveHistoryLogFile(sessionUserData);
            await SaveUpdateStatitics("PasswordsChange", users.Count);
        }

        return (message?.Length > 0) ? message.ToString() : null;
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

        await _localFileService.SaveUpdateEncryptedFile(statistics, "catalogs/statistics");
    }

    // Save log file
    private async Task SaveHistoryLogFile(Data model)
    {
        var user = _provider.FindUserByUsername(_credentialsService.GetClaim("username", Request) ?? "");
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
        await _localFileService.SaveUpdateEncryptedFile(histories, "catalogs/histories");
    }
    #endregion
}
