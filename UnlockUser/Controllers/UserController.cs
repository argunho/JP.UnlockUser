using UnlockUser.ViewModels;
using UnlockUser.Interface;
using UnlockUser.Models;
using UnlockUser.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Diagnostics;
using System.Net;
using System.DirectoryServices;

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
    public UserController(IActiveDirectory provider, IHttpContextAccessor contextAccessor, IFunctions functions)
    {
        _provider = provider;
        _contextAccessor = contextAccessor;
        _session = _contextAccessor.HttpContext.Session;
        _functions = functions;
    }

    #region GET
    [HttpGet("{name}")] // Get user information by username
    public JsonResult GetUser(string name)
    {

        DirectorySearcher members = _provider.GetMembers(_session.GetString("GroupName"));
        members.Filter = $"(&(objectClass=User)(|(cn={name})(sAMAccountname={name})))";
        var user = members.FindOne();

        if (user == null)
            return new JsonResult(new { warning = true, msg = $"Användaren med anvädarnamn {name} har inte hittats." });

        var userData = SearchController.GetUsers(members);
        //var prop = user.Properties;
        //var userData = new User
        //{
        //    Name = prop.Contains("cn") ? prop["cn"][0].ToString() : "",
        //    DisplayName = prop.Contains("displayName") ? prop["displayName"][0].ToString() : "",
        //    Email = prop.Contains("userPrincipalName") ? prop["userPrincipalName"][0].ToString() : "",
        //    Office = prop.Contains("physicalDeliveryOfficeName") ? prop["physicalDeliveryOfficeName"][0].ToString() : "",
        //    Department = prop.Contains("department") ? prop["department"][0].ToString() : "",
        //    IsLocked = prop.Contains("lockoutTime") ? int.Parse(prop["lockoutTime"][0].ToString()) >= 1 : false
        //};


        //var user = _provider.FindUserByExtensionProperty(name);
        //var userData = new User
        //{
        //    Name = user.Name,
        //    DisplayName = user.DisplayName,
        //    Email = user.UserPrincipalName,
        //    Office = user.Office,
        //    Department = user.Department,
        //    IsLocked = user.IsAccountLockedOut(),
        //    Date = user.AccountLockoutTime
        //};

        var charachtersLength = 8;
        if (_provider.MembershipCheck(name, "Password Twelve Characters"))
            charachtersLength = 12;

        _session.SetString("Office", userData[0].Office);
        _session.SetString("Department", userData[0].Department);

        return new JsonResult(new { user = userData, passwordLength = charachtersLength });
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

        Data log = GetLogData();

        // Set password to class students
        foreach (var user in model.Users)
        {
            message += _provider.ResetPassword(UpdatedUser(user));
            log.Users.Add(user?.Username ?? "");
        }

        SaveLogFile(log);

        return ReturnResultMessage(message);
    }

    [HttpPost("unlock/{name}")] // Unlock user
    [AllowAnonymous]
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

    [HttpPost("mail/{str}")] // Send email to current logged admin
    public JsonResult SendEmail(string str, IFormFile attachedFile)
    {
        try
        {
            MailRepository ms = new(); // Implementation of MailRepository class where email content is structured and SMTP connection with credentials

            string mail = _session?.GetString("Email") ?? String.Empty;

            var success = ms.SendMail(mail, "Lista över nya lösenord till " + str + " elever",
                        $"Hej {_session?.GetString("DisplayName")}!<br/> Här bifogas PDF document filen med nya lösenord till elever från klass {str}.",
                        mail ?? "", _session?.GetString("Password") ?? "", attachedFile);
            if (!success)
                return new JsonResult(new
                {
                    alert = "warning",
                    msg = $"Det gick inte att skicka e-post med pdf dokument till e-postadress {mail}",
                    errorMessage = MailRepository._message
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

            MailRepository ms = new();
            foreach (var u in members)
            {
                var user = _provider.FindUserByExtensionProperty(u.Name);
                if (user != null && user.Title == "Systemutvecklare" && user.Department == "IT Serviceavdelning")
                {
                    model.Title = "Unlock User : Felmeddelande";
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
            return new JsonResult(new { errorMessage = MailRepository._message });
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

        // get computer name
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
                Group = _session.GetString("Group"),
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

    // Save log file
    public void SaveLogFile(Data model)
    {
        var user = _provider.FindUserByExtensionProperty(_session.GetString("Username"));
        string fileName = (model.Group?.ToLower() ?? "") + "_";

        var contentList = new List<string>
        {
            "\r Anställd",
            " - Användarnamn: " + (user?.DisplayName ?? ""),
            " - Namn: " + (user?.Name ?? ""),
            " - E-postadress: " + (user?.EmailAddress ?? ""),
            " - Arbetsplats: " + (user.Department ?? ""),
            " - Tjänst: " + (user.Title ?? ""),
            "\n\r Dator",
            " - Datornamn: " + model?.ComputerName,
            " - IpAddress: " + model?.IpAddress,
            "\n\r Hantering",
            " - Gruppnamn: " + model?.Group
        };

        if (model?.Group == "Studenter")
        {
            contentList.Add(" - Skolan: " + model?.Office);
            contentList.Add(" - Klassnamn: " + model?.Department);
            contentList.Add($" - Lösenord till {model?.Users.Count} student{(model?.Users.Count > 1 ? "er" : "")}:");
            fileName += model?.Office + "_" + model?.Department + (model.Users.Count == 1 ? "_" + model.Users[0] : "");
            foreach (var student in model?.Users)
            {
                contentList.Add("\t- Student: " + student);
            }
        }
        else
        {
            contentList.Add(" - Arbetsplats: " + model?.Office);
            contentList.Add(" - Lösenord till:");
            contentList.Add("\t-Politiker: " + model.Users[0]);

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

    // Help method to structure a result message
    public JsonResult ReturnResultMessage(string? message)
    {
        if (message?.Length > 0)
            return new JsonResult(new { alert = "warning", msg = message });

        return new JsonResult(new { success = true, alert = "success", msg = "Lösenordsåterställningen lyckades!" }); //Success! Password reset was successful!
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
