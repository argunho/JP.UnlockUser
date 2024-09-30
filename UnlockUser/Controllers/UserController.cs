using UnlockUser.ViewModels;
using UnlockUser.Interface;
using UnlockUser.Models;
using UnlockUser.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Diagnostics;
using System.Net;
using System.DirectoryServices;
using static Org.BouncyCastle.Math.EC.ECCurve;
using Microsoft.IdentityModel.Tokens;

namespace UnlockUser.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize]
public class UserController : ControllerBase
{

    private readonly IActiveDirectory _provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly IHttpContextAccessor _contextAccessor;
    private readonly ISession _session;
    private readonly IFunctions _functions;
    private readonly IConfiguration _config;

    public UserController(IActiveDirectory provider, IHttpContextAccessor contextAccessor, IFunctions functions, IConfiguration config)
    {
        _provider = provider;
        _contextAccessor = contextAccessor;
        _session = _contextAccessor.HttpContext.Session;
        _functions = functions;
        _config = config;
    }

    #region GET
    [HttpGet("{group}/{name}")] // Get user information by username
    public JsonResult GetUser(string name, string group)
    {
        DirectorySearcher members = _provider.GetMembers(group);
        members.Filter = $"(&(objectClass=User)(|(cn={name})(sAMAccountname={name})))";
        var user = members.FindOne();

        if (user == null)
            return new JsonResult(new { warning = true, msg = $"Användaren med anvädarnamn {name} har inte hittats." });

        var userData = _provider.GetUsers(members, group);

        var charachtersLength = 8;
        if (_provider.MembershipCheck(_provider.FindUserByName(name), "Password Twelve Characters"))
            charachtersLength = 12;

        _session.SetString("ManagedOffice", userData[0].Office);
        _session.SetString("ManagedDepartment", userData[0].Department);

        return new JsonResult(new { user = userData[0], passwordLength = charachtersLength });
    }

    [HttpGet("unlock/{name}")] // Unlock user
    public JsonResult UnlockUser(string name)
    {
        var model = new UserViewModel
        {
            Username = name
        };

        var message = _provider.UnlockUser(UpdatedUser(model));
        if (message.Length > 0)
            return new JsonResult(new { alert = "warning", msg = message });

        return new JsonResult(new { success = true, unlocked = true, alert = "success", msg = "Användaren har låsts upp!" });
    }
    #endregion

    #region POST
    [HttpPost("resetPassword")] // Reset class students passwords
    public JsonResult SetMultiplePaswords(UsersList model)
    {
        // Check model is valid or not and return warning is true or false
        if (model.Users.Count == 0)
            return new JsonResult(new { alert = "warning", msg = "Användare för lösenordsåterställning har inte specificerats." }); // Password reset user not specified

        string message = string.Empty;

        Data sessionUserData = GetLogData();
        string sessionOffice = sessionUserData.Office?.ToLower();
        if (sessionOffice == "Gymnasiet yrkesvux lärvux".ToLower())
            sessionOffice = "Allbo Lärcenter gymnasieskola".ToLower();

        var manager = GetClaim("manager");

        var roles = GetClaim("roles");
        var stoppedToEdit = new List<string>();

        var permissionGroups = (_config.GetSection("Groups").Get<List<GroupParameters>>()).Select(s => s.Group).ToList();

        if (roles != null && !roles.Contains("Developer", StringComparison.CurrentCulture))
        {
            // Get all usernamse as a list
            var usernames = model.Users.Select(s => s.Username).ToList();

            //Loop each username
            foreach (var username in usernames)
            {
                var user = _provider.FindUserByExtensionProperty(username);
                if (user == null)
                    continue;

                // Get all user groups to check users membership in permission groups
                var userGroups = _provider.GetUserGroups(user);
                var forbidden = userGroups.Exists(x => permissionGroups.Contains(x));

                if (forbidden)
                {
                    stoppedToEdit.Add(username);
                    model.Users.RemoveAll(x => x.Username == username);
                    continue;
                }
                else if (sessionUserData.Group?.ToLower() != "studenter" && user.Manager != manager)
                {
                    stoppedToEdit.Add(username);
                    model.Users.RemoveAll(x => x.Username == username);
                } else if(user.Office.ToLower() != sessionOffice && (!user.Office.IsNullOrEmpty() && !sessionOffice.Contains(user.Office.ToLower())))
                {
                    stoppedToEdit.Add(username);
                    model.Users.RemoveAll(x => x.Username == username);
                }
            }
        }

        // Set password to class students
        if (model.Users.Count > 0)
        {
            foreach (var user in model.Users)
            {
                message += _provider.ResetPassword(UpdatedUser(user));
                sessionUserData.Users.Add(user?.Username ?? "");
            }

            SaveLogFile(sessionUserData);
        }

        if (message?.Length > 0)
            return new JsonResult(new { alert = "warning", msg = message });
        else if (stoppedToEdit?.Count > 0 && model.Users.Count == 0)
            return new JsonResult(new { alert = "error", msg = $"Du saknar behörigheter att ändra lösenord till {string.Join(",", stoppedToEdit)}!" }); // Warning!
        else if (stoppedToEdit?.Count > 0)
            return new JsonResult(new { alert = "info", msg = $"Lösenordsåterställningen lyckades men inte till alla! Du saknar behörigheter att ändra lösenord till {string.Join(",", stoppedToEdit)}!" });

        return new JsonResult(new { success = true, alert = "success", msg = "Lösenordsåterställningen lyckades!" }); //Success! Password reset was successful!
    }

    [HttpPost("mail/{str}")] // Send email to current logged admin
    public JsonResult SendEmail(string str, IFormFile attachedFile)
    {
        try
        {
            MailService ms = new(); // Implementation of MailRepository class where email content is structured and SMTP connection with credentials

            string mail = _session?.GetString("Email") ?? String.Empty;

            var success = ms.SendMail(mail, "Lista över nya lösenord till " + str + " elever",
                        $"Hej {_session?.GetString("DisplayName")}!<br/> Här bifogas PDF document filen med nya lösenord till elever från klass {str}.",
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
            var members = group?.GetMembers(true)?.ToList();

            MailService ms = new();
            foreach (var u in members)
            {
                var user = _provider.FindUserByExtensionProperty(u.Name);
                if (user != null && user.Title == "Systemutvecklare" && user.Department == "IT Serviceavdelning")
                {
                    model.Title = "Felmeddelande";
                    model.Text = "Något har gott snett på " + model.Link + "<br/><br/><b>Fel: </b>" + model.Error +
                        "<br/><br/>Avsändare: " + (_session.GetString("Username")?.Length > 0 ? _session.GetString("Username") : "Ej definerad");
                    model.Email = user.EmailAddress;
                    ms.SendContactEmail(model);
                }
            }
        }
        catch (Exception ex)
        {
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
            Username = _session.GetString("Username"),
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
                Office = _session.GetString("Office"),
                Department = _session.GetString("Department"),
                ManagedUserOffice = _session.GetString("ManagedOffice"),
                ManagedUserDepartment = _session.GetString("ManagedDepartment"),
                Group = _session.GetString("GroupName"),
                ComputerName = pcName,
                IpAddress = _contextAccessor.HttpContext.Connection.RemoteIpAddress.ToString()
            };
        }
        catch (Exception e)
        {
            Debug.WriteLine(e.Message);
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
    public void SaveLogFile(Data model)
    {
        var user = _provider.FindUserByExtensionProperty(_session.GetString("Username"));
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

        fileName += "_" + DateTime.Now.ToString("yyyyMMddHHmmss");

        _functions.SaveHistoryLogFile(contentList, fileName, ".txt");
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
