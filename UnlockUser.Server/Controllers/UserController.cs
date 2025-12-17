using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Diagnostics;
using System.DirectoryServices;
using System.Globalization;
using System.Net;
using System.Text;
using UnlockUser.Server.FormModels;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UserController(IActiveDirectory provider, IHttpContextAccessor contextAccessor, IWebHostEnvironment env,
    ILocalFileService localFileService, IHelpService helpService, IConfiguration config, ILocalUserService localService, 
    ICredentialsService credinalService, ILocalMailService localMailService) : ControllerBase
{

    private readonly IActiveDirectory _provider = provider;
    private readonly IHttpContextAccessor _contextAccessor = contextAccessor;
    private readonly ISession _session = contextAccessor.HttpContext!.Session;
    private readonly IConfiguration _config = config;
    private readonly IHelpService _helpService = helpService;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IWebHostEnvironment _env = env;
    private readonly ILocalUserService _localService = localService;
    private readonly ICredentialsService _credentialsService = credinalService;
    private readonly ILocalMailService _localMailService = localMailService;

    private readonly string ctrl = nameof(UserController);

    #region GET
    // Get user information by username
    [HttpGet("{group}/{name}")]
    public IActionResult GetUser(string group, string name)
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
                        && (_localService.Filter([user], groupName, claims!["permission"])?.Count == 0))
                {
                    return Ok(_helpService.Warning($"Du saknar behörigheter att ändra lösenord till {user.DisplayName}!"));
                }

                if (_provider.MembershipCheck(_provider.FindUserByUsername(name), "Password Twelve Characters"))
                    user!.PasswordLength = 12;
            }
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error($"{ctrl}: {nameof(GetUser)}", ex));
        }

        return Ok(new { user });
    }

    [HttpGet("unlock/{username}")] // Unlock user
    public async Task<IActionResult> UnlockUser(string username)
    {
        try
        {

            var credentials = CurrentUSerCredentials();

            var message = _provider.UnlockUser(username, credentials);
            if (message.Length > 0)
                return Ok(_helpService.Warning(message));
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error($"{ctrl}: {nameof(UnlockUser)}", ex));
        }

        // Save/Update statistics
        await SaveUpdateStatitics("Unlocked", 1);

        return Ok(new { success = true, color = "success", msg = "Användaren har låsts upp!" });
    }
    #endregion

    #region POST
    [HttpPost("reset/passwords")] // Reset class students passwords
    public async Task<IActionResult> SetPasswords([FromForm] UsersListFormModel model)
    {
        try
        {
            var res = await SetMultiplePasswords(model);
            if (string.IsNullOrEmpty(res))
                return Ok(new { color = "success", success = true, msg = "Lösenordsåterställningen lyckades!" });

            return BadRequest(_helpService.Warning(res));
        }
        catch (Exception ex)
        {
            return BadRequest(_helpService.Error($"{ctrl}: {nameof(SetPasswords)}", ex));
        }
    }

    [HttpPost("reset/save/passwords")]
    public async Task<IActionResult> SetPasswordsSavePdf([FromForm] IFormFile file, [FromForm] string data, [FromForm] string label)
    {
        try
        {

            bool isFileEmpty = (file == null || file.Length == 0);
            UsersListFormModel? model = System.Text.Json.JsonSerializer.Deserialize<UsersListFormModel>(data);
            var res = await SetMultiplePasswords(model!);
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
            return BadRequest(_helpService.Error($"{ctrl}: {nameof(SetPasswordsSavePdf)}", ex));
        }
    }
    #endregion

    #region Helpers
    // Return extension of User
    public CredentialsViewModel CurrentUSerCredentials()
    => new()
    {
        Username = _credentialsService.GetClaim("Username", Request),
        Password = _helpService.DecodeFromBase64(_session.GetString("HashedCredential")!)?.Replace(_config["JwtSettings:Key"]!, "")
    };

    // Return information
    public Data GetLogData(string group, string office, string department)
    {
        var ip = Request.HttpContext.Connection.RemoteIpAddress?.ToString();

        // Get computer name
        IPHostEntry GetIPHost = Dns.GetHostEntry(IPAddress.Parse(ip));
        List<string> compName = [.. GetIPHost.HostName.ToString().Split('.')];
        string pcName = compName.First();
        //string computerName = (Environment.MachineName ?? System.Net.Dns.GetHostName() ?? Environment.GetEnvironmentVariable("COMPUTERNAME"));

        var claims = _credentialsService.GetClaims(["office", "department"], Request) ?? [];
        var data = new Data();
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
                IpAddress = _contextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString()
            };
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
        }

        return data;
    }

    // Set multiple passwords
    public async Task<string?> SetMultiplePasswords(UsersListFormModel model)
    {
        // Check model is valid or not and return warning is true or false
        if (model.Users.Count == 0)
            return "Användare för lösenordsåterställning har inte specificerats."; // Password reset user not specified

        StringBuilder? message = null;

        Data sessionUserData = GetLogData(model.GroupName!, model.Office!, model.Department!);
        string? sessionOffice = sessionUserData.Office?.ToLower();

        var claims = _credentialsService.GetClaims(["groups", "roles", "username", "permission"], Request);
        var groups = claims?["groups"].Split(",") ?? [];
        var roles = claims?["roles"].Split(",") ?? [];

        var groupsList = _config.GetSection("Groups").Get<List<GroupModel>>();
        if (groupsList?.Select(s => s.Name).Intersect(groups).Count() == 0)
            return "Behörigheter saknas!"; // Warning!

        List<string?>? permissionGroups = [.. groupsList!.Select(s => s.PermissionGroup)];

        //return null;
        if (!roles.Contains("Support", StringComparer.OrdinalIgnoreCase))
        {
            var users = new List<UserFormModel>();
            var permissions = JsonConvert.DeserializeObject<PermissionsViewModel>(claims!["permission"])!;
            if (model.Users.Count > 0 && model.GroupName!.Equals("Students", StringComparison.OrdinalIgnoreCase))
            {
                if (permissions.Offices.Contains(model.Office, StringComparer.OrdinalIgnoreCase))
                    users = model.Users;
            }
            else
            {
                var user = _provider.FindUserByUsername(model.Users[0].Username!);
                if (user != null && permissions.Managers.Contains(user.Manager))
                    users = model.Users;
            }

            if (users.Count == 0)
                return $"Du saknar behörigheter att ändra lösenord till {(model.Users.Count > 0 ? $"{model.Department} {model.Office}" : model.Users[0].Username)}";
        }

        var credenitsla = CurrentUSerCredentials();
        // Set password to class students
        foreach (var user in model.Users)
        {
            try
            {
                _provider.ResetPassword(user, credenitsla);
                if (_env.IsProduction())
                    sessionUserData.Users.Add(user?.Username ?? "");
            }
            catch (Exception ex)
            {
                message?.Append($"Fel vid försök ändra lösenord till {user.Username}: {ex.Message}");
            }
        }

        // Save/Update statistics
        if (!model.Check && _env.IsProduction())
        {
            SaveHistoryLogFile(sessionUserData);
            await SaveUpdateStatitics("PasswordsChange", model.Users.Count);
        }

        if (message?.Length > 0)
            return message.ToString();

        return null; //Success! Password reset was successful!
    }

    // Save update statistik
    public async Task SaveUpdateStatitics([FromBody] string param, int count)
    {
        try
        {
            var year = DateTime.Now.Year;
            var month = DateTime.Now.ToString("MMMM", CultureInfo.InvariantCulture);

            var passChange = (param == "PasswordsChange");

            var statistics = _localFileService.GetListFromFile<Statistics>("statistics");
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

            await _localFileService.SaveUpdateFile(statistics, "statistics");

        }
        catch (Exception ex)
        {
            _localFileService.SaveLogFile(["Save statistics", $"Fel: {ex.Message}"], "errors");
        }
    }

    // Save log file
    public void SaveHistoryLogFile([FromBody] Data model)
    {
        try
        {
            var user = _provider.FindUserByUsername(_credentialsService.GetClaim("username", Request) ?? "");
            var groupName = model?.Group?.ToLower();
            string fileName = (groupName ?? "") + "_";

            if (groupName != "studenter")
            {
                var managedUser = _provider.FindUserByUsername(model!.Users[0]);
                if (managedUser != null)
                {
                    model.Office = user.Office;
                    model.Department = user.Department;
                }
            }

            var contentList = new List<string>
                {
                    "\r Anställd",
                    " - Användarnamn: " + (user?.Name ?? ""),
                    " - Namn: " + (user?.DisplayName ?? ""),
                    " - E-postadress: " + (user?.EmailAddress ?? ""),
                    " - Arbetsplats: " + (user.Department ?? ""),
                    " - Tjänst: " + (user.Title ?? ""),
                    "\n\r Dator",
                    " - Datornamn: " + model?.ComputerName,
                    " - IpAddress: " + model?.IpAddress,
                    "\n\r Hantering",
                    " - Gruppnamn: " + model?.Group
                };


            if (groupName == "studenter")
            {
                contentList.Add(" - Skolan: " + model?.ManagedUserOffice);
                contentList.Add(" - Klassnamn: " + model?.ManagedUserDepartment);
                contentList.Add($" - Lösenord till {model?.Users.Count} student{(model?.Users.Count > 1 ? "er" : "")}:");
                fileName += model?.Office + "_" + model?.ManagedUserDepartment + (model?.Users.Count == 1 ? "_" + model.Users[0] : "");
                foreach (var student in model?.Users)
                    contentList.Add("\t- Student: " + student);
            }
            else
            {
                contentList.Add(" - Arbetsplats: " + model?.Office);
                contentList.Add(" - Lösenord till:");
                contentList.Add($"\t-{model?.Group}: {model?.Users[0]}");
            }

            _localFileService.SaveLogFile(contentList, "history");
        }
        catch (Exception ex)
        {
            _localFileService.SaveLogFile(["SaveLogFile", $"Fel: {ex.Message}"], "errors");
        }
    }
    #endregion
}
