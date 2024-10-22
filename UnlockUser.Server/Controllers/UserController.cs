using UnlockUser.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Diagnostics;
using System.Net;
using System.DirectoryServices;
using System.Globalization;

namespace UnlockUser.Server.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize]
public class UserController(IActiveDirectory provider, IHttpContextAccessor contextAccessor, IHelp help, IConfiguration config, SearchController search) : ControllerBase
{

    private readonly IActiveDirectory _provider = provider;
    private readonly IHttpContextAccessor _contextAccessor = contextAccessor;
    private readonly ISession _session = contextAccessor.HttpContext.Session;
    private readonly IConfiguration _config = config;
    private readonly IHelp _help = help;
    private readonly SearchController _search = search;


    #region GET
    // Get user information by username
    [HttpGet("{group}/{name}")]
    public JsonResult GetUser(string group, string name)
    {
        var groupName = group == "Studenter" ? "Students" : "Employees";
        DirectorySearcher members = _provider.GetMembers(groupName);
        members.Filter = $"(&(objectClass=User)(|(cn={name})(sAMAccountname={name})))";

        if (members.FindOne() == null)
            return new JsonResult(new { warning = true, msg = $"Användaren med anvädarnamn {name} har inte hittats." });

        var user = (_provider.GetUsers(members, group)).FirstOrDefault();

        if (_provider.MembershipCheck(_provider.FindUserByExtensionProperty(name), "Password Twelve Characters"))
            user.PasswordLength = 12;

        _session.SetString("ManagedOffice", user.Office);
        _session.SetString("ManagedDepartment", user.Department);

        user = (_search.FilteredListOfUsers([user], false, group, GetClaim("roles"), GetClaim("username")))?.FirstOrDefault();
        if (user != null)
            return new JsonResult(new { user });

        return new JsonResult(null);
    }

    [HttpGet("unlock/{name}")] // Unlock user
    public JsonResult UnlockUser(string name)
    {
        try
        {
            var model = new UserViewModel
            {
                Username = name
            };

            var message = _provider.UnlockUser(UpdatedUser(model));
            if (message.Length > 0)
                return new JsonResult(new { alert = "warning", msg = message });
        }
        catch (Exception ex)
        {
            _help.SaveFile(["UnlockUser", $"Fel: {ex.Message}"], "errors", "error");
            return new JsonResult(new { alert = "error", msg = $"Något har gått snett. Fel: {ex.Message}" });
        }


        return new JsonResult(new { success = true, unlocked = true, alert = "success", msg = "Användaren har låsts upp!" });
    }
    #endregion

    #region POST
    [HttpPost("reset/password")] // Reset class students passwords
    public async Task<JsonResult> SetPaswords(UsersListViewModel model)
    {
        try
        {
            // Check model is valid or not and return warning is true or false
            if (model.Users.Count == 0)
                return new JsonResult(new { alert = "warning", msg = "Användare för lösenordsåterställning har inte specificerats." }); // Password reset user not specified

            string message = string.Empty;

            Data sessionUserData = GetLogData();
            string sessionOffice = sessionUserData.Office?.ToLower();

            var roles = GetClaim("roles");
            var groups = (GetClaim("groups"))?.Split(",").ToList() ?? [];


            var groupsList = _config.GetSection("Groups").Get<List<GroupModel>>();
            if(groupsList?.Select(s => s.Name).Intersect(groups) == null)
                return new JsonResult(new { alert = "error", msg = $"Behörigheter saknas!" }); // Warning!


            var stoppedToEdit = new List<string>();
            var permissionGroups = groupsList.Select(s => s.PermissionGroup).ToList();

            if (roles != null && !roles.Contains("Support", StringComparison.CurrentCulture))
            {
                //Loop each username
                foreach (var userModel in model.Users)
                {
                    var username = userModel.Username;
                    var user = _provider.FindUserByExtensionProperty(username);

                    // Get all user groups to check users membership in permission groups
                    var userGroups = _provider.GetUserGroups(user);
                    var forbidden = userGroups.Exists(x => permissionGroups.Contains(x));
                    var filteredList = _search.FilteredListOfUsers([new User { Name = user.Name, Title = user.Title }], false,
                                userModel.GroupName, GetClaim("roles"), GetClaim("username"));

                    if (user == null || filteredList?.Count == 0 || forbidden)
                    {
                        stoppedToEdit.Add(username);
                        continue;
                    }
                }

                model.Users.RemoveAll(x => stoppedToEdit.Contains(x.Username));
            }

            // Set password to class students
            if (model.Users.Count > 0)
            {
                foreach (var user in model.Users)
                {
                    message += _provider.ResetPassword(UpdatedUser(user));
                    sessionUserData.Users.Add(user?.Username ?? "");
                }

                SaveHistoryLogFile(sessionUserData);
            }

            // Save statistics
            try
            {
                var statistics = IHelpService.GetJsonList<Statistics>("statistics");
                statistics ??= [];
                var year = DateTime.Now.Year;
                var month = DateTime.Now.ToString("MMMM", CultureInfo.InvariantCulture);
                var currentMonth = statistics.FirstOrDefault(x => x.Month == month && x.Year == year);
                if (statistics.Count == 0 || !statistics.Exists(x => x.Year == year) || !statistics.Exists(x => x.Year == year || currentMonth == null)) {
                    statistics.Add(new Statistics
                    {
                        Year = year,
                        Month = month,
                        Count = model.Users.Count
                    });
                } else if(currentMonth != null)
                    currentMonth.Count += model.Users.Count;

                await IHelpService.SaveUpdateJsonFile(statistics, "statistics");

            }catch(Exception ex)
            {
                _help.SaveFile(["Save statistics", $"Fel: {ex.Message}"], "errors", "error");
            }

            if (message?.Length > 0)
                return new JsonResult(new { alert = "warning", msg = message });
            else if (stoppedToEdit?.Count > 0 && model.Users.Count == 0)
                return new JsonResult(new { alert = "error", msg = $"Du saknar behörigheter att ändra lösenord till {string.Join(",", stoppedToEdit)}!" }); // Warning!
            else if (stoppedToEdit?.Count > 0)
                return new JsonResult(new { alert = "info", msg = $"Lösenordsåterställningen lyckades men inte till alla! Du saknar behörigheter att ändra lösenord till {string.Join(",", stoppedToEdit)}!" });


            return new JsonResult(new { success = true, alert = "success", msg = "Lösenordsåterställningen lyckades!" }); //Success! Password reset was successful!
        }
        catch (Exception ex)
        {

            _help.SaveFile(["SetPassword", $"Fel: {ex.Message}"], "errors", "error");
            return new JsonResult(new { alert = "error", msg = $"Något har gått snett: Fel: {ex.Message}" });
        }
    }

    [HttpPost("mail/{str}")] // Send email to current logged admin
    public JsonResult SendEmail(string str, IFormFile attachedFile)
    {
        try
        {
            MailService ms = new(); // Implementation of MailRepository class where email content is structured and SMTP connection with credentials

            string? mail = GetClaim("Email");

            var success = ms.SendMail(mail, "Lista över nya lösenord till " + str + " elever",
                        $"Hej {GetClaim("DisplayName")}!<br/> Här bifogas PDF document filen med nya lösenord till elever från klass {str}.",
                        mail ?? "", _session?.GetString("Password") ?? "", attachedFile);
            if (!success)
                return new JsonResult(new
                {
                    alert = "warning",
                    msg = $"Det gick inte att skicka e-post med pdf dokument till e-postadress {mail}",
                    errorMessage = MailService._message
                });
        }
        catch (Exception ex)
        {

            _help.SaveFile(["SendEmail", $"Fel: {ex.Message}"], "errors", "error");
            return Error(ex.Message);
        }

        return new JsonResult(new { result = true });
    }

    [HttpPost("contact/error")] // Send email to support
    [AllowAnonymous]
    public JsonResult SendEmailToSupport(ContactViewModel model)
    {
        try
        {
            var group = _provider.FindGroupName("Topdesk-Operator IT");
            var members = group.GetMembers(true)?.ToList();
            var username = GetClaim("Username");

            MailService ms = new();
            foreach (var u in members)
            {
                var user = _provider.FindUserByExtensionProperty(u.Name);
                if (user != null && user.Title == "Systemutvecklare" && user.Department == "IT Serviceavdelning")
                {
                    model.Title = "Felmeddelande";
                    model.Text = "Något har gott snett på " + model.Link + "<br/><br/><b>Fel: </b>" + model.Error +
                        "<br/><br/>Avsändare: " + (username?.Length > 0 ? username : "Ej definerad");
                    model.Email = user.EmailAddress;
                    ms.SendContactEmail(model);
                }
            }
        }
        catch (Exception ex)
        {
            _help.SaveFile(["SendEmailToSupport", $"Fel: {ex.Message}"], "errors", "error");
            Debug.WriteLine(ex.Message);
            return new JsonResult(new { errorMessage = MailService._message });
        }

        return new JsonResult(true);
    }
    #endregion

    #region Helpers
    // Return extension of User
    public UserViewModel UpdatedUser(UserViewModel user)
    {
        user.Credentials = new UserCredentials
        {
            Username = GetClaim("Username"),
            Password = _session.GetString("Password")
        };

        return user;
    }

    // Return information
    public Data GetLogData()
    {
        var ip = Request.HttpContext.Connection.RemoteIpAddress.ToString();

        // Get computer name
        IPHostEntry GetIPHost = Dns.GetHostEntry(IPAddress.Parse(ip));
        List<string> compName = GetIPHost.HostName.ToString().Split('.').ToList();
        string pcName = compName.First();
        //string computerName = (Environment.MachineName ?? System.Net.Dns.GetHostName() ?? Environment.GetEnvironmentVariable("COMPUTERNAME"));

        try
        {
            return new Data
            {
                Office = GetClaim("Office"),
                Department = GetClaim("Department"),
                ManagedUserOffice = _session.GetString("ManagedOffice"),
                ManagedUserDepartment = _session.GetString("ManagedDepartment"),
                Group = _session.GetString("GroupName"),
                ComputerName = pcName,
                IpAddress = _contextAccessor.HttpContext.Connection.RemoteIpAddress.ToString()
            };
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
        }

        return new Data();
    }

    // Get claim
    public string? GetClaim(string? name)
    {
        try
        {
            var claims = User.Claims;
            if (!claims.Any()) return null;

            return claims.FirstOrDefault(x => x.Type?.ToLower() == name?.ToLower())?.Value?.ToString();
        }
        catch (Exception)
        {
            return null;
        }
    }

    // Save log file
    public void SaveHistoryLogFile(Data model)
    {
        var user = _provider.FindUserByExtensionProperty(GetClaim("Username"));
        string fileName = (model.Group?.ToLower() ?? "") + "_";

        var groupName = model.Group.ToLower();
        if (groupName != "studenter")
        {
            var managedUser = _provider.FindUserByExtensionProperty(model.Users[0]);
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
            fileName += model?.Office + "_" + model?.ManagedUserDepartment + (model.Users.Count == 1 ? "_" + model.Users[0] : "");
            foreach (var student in model?.Users)
            {
                contentList.Add("\t- Student: " + student);
            }
        }
        else
        {
            contentList.Add(" - Arbetsplats: " + model?.Office);
            contentList.Add(" - Lösenord till:");
            contentList.Add($"\t-{model.Group}: {model.Users[0]}");

            fileName += model?.Office + "_" + model.Users[0];
        }

        _help.SaveFile(contentList, "history", fileName);
    }

    // Help method to structure a warning message
    public JsonResult? ReturnWarningsMessage(UserViewModel model)
    {
        if (!ModelState.IsValid)
            return new JsonResult(new { alert = "warning", msg = "Felaktigt eller ofullständigt ifyllda formulär" }); // Forms filled out incorrectly
        else if (model.Username == null)
            return new JsonResult(new { alert = "warning", msg = "Användare för lösenordsåterställning har inte specificerats." }); // Password reset user not specified

        return null;
    }

    // Return Error response
    public JsonResult Error(string msg)
    {
        // Activate a button in the user interface for sending an error message to the system developer if the same error is repeated more than two times during the same session
        var repeated = _session?.GetInt32("RepeatedError") ?? 0;
        _session?.SetInt32("RepeatedError", repeated += 1);
        return new JsonResult(new
        {
            alert = "warning",
            msg = "Något har gått snett. Var vänlig försök igen.",
            repeatedError = repeated,
            errorMessage = msg
        }); // Something went wrong, please try again later
    }
    #endregion
}
