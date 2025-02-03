﻿using UnlockUser.Services;
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
        try
        {
            var groupName = group == "Studenter" ? "Students" : "Employees";
            DirectorySearcher members = _provider.GetMembers(groupName);
            members.Filter = $"(&(objectClass=User)(|(cn={name})(sAMAccountname={name})))";

            var claims = _help.GetClaims("roles", "username");

            if (members.FindOne() != null)
            {
                var user = (_provider.GetUsers(members, group)).FirstOrDefault();

                if (_provider.MembershipCheck(_provider.FindUserByExtensionProperty(name), "Password Twelve Characters"))
                    user.PasswordLength = 12;

                _session.SetString("ManagedOffice", user.Office);
                _session.SetString("ManagedDepartment", user.Department);

                user = (_search.FilteredListOfUsers([user], false, group, claims["roles"], claims["username"]))?.FirstOrDefault();
                if (user != null)
                    return new(new { user });
            }
        }
        catch (Exception ex)
        {
            return _help.Error("UserController: GetUser", ex.Message);
        }

        return _help.NotFound("Användaren");
    }

    [HttpGet("unlock/{name}")] // Unlock user
    public async Task<JsonResult> UnlockUser(string name)
    {
        try
        {
            var model = new UserViewModel
            {
                Username = name
            };

            var message = _provider.UnlockUser(UpdatedUser(model));
            if (message.Length > 0)
                return _help.Warning(message);
        }
        catch (Exception ex)
        {
            return _help.Error("UserController: UnlockUser", ex.Message);
        }

        // Save/Update statistics
        await SaveUpdateStatitics("Unlocked", 1);

        return new(new { success = true, unlocked = true, alert = "success", msg = "Användaren har låsts upp!" });
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
                return _help.Warning("Användare för lösenordsåterställning har inte specificerats."); // Password reset user not specified

            string message = string.Empty;

            Data sessionUserData = GetLogData();
            string? sessionOffice = sessionUserData.Office?.ToLower();

            var claims = _help.GetClaims("groups", "roles", "username");
            var groups = claims?["groups"].Split(",") ?? [];
            var roles = claims?["roles"].Split(",") ?? [];

            var groupsList = _config.GetSection("Groups").Get<List<GroupModel>>();
            if (groupsList?.Select(s => s.Name).Intersect(groups).Count() == 0)
                return _help.Warning("Behörigheter saknas!"); // Warning!

            List<string> stoppedToEdit = [];
            List<string> permissionGroups = [.. groupsList.Select(s => s.PermissionGroup)];

            if (!roles.Contains("Support"))
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
                                userModel.GroupName, claims["roles"], claims["username"]);

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

                if (!model.Check)
                    SaveHistoryLogFile(sessionUserData);

                if (!string.IsNullOrEmpty(_help.Message))
                    return _help.Warning(message);
            }

            // Save/Update statistics
            if (!model.Check)
                await SaveUpdateStatitics("PasswordsChange", model.Users.Count);

            if (message?.Length > 0)
                return _help.Warning(message);
            else if (stoppedToEdit?.Count > 0 && model.Users.Count == 0)
                return _help.Warning($"Du saknar behörigheter att ändra lösenord till {string.Join(",", stoppedToEdit)}!"); // Warning!
            else if (stoppedToEdit?.Count > 0)
                return _help.Response("info", $"Lösenordsåterställningen lyckades men inte till alla! Du saknar behörigheter att ändra lösenord till {string.Join(",", stoppedToEdit)}!");


            return _help.Response("success", "Lösenordsåterställningen lyckades!"); //Success! Password reset was successful!
        }
        catch (Exception ex)
        {
            return _help.Error("UsersController: SetPassword", ex.Message);
        }
    }

    [HttpPost("mail/{str}")] // Send email to current logged admin width pdf file
    public JsonResult SendEmail(string str, IFormFile attachedFile)
    {
        try
        {
            MailService ms = new(); // Implementation of MailRepository class where email content is structured and SMTP connection with credentials

            var claims = _help.GetClaims("email", "displayname") ?? [];

            var success = ms.SendMail(claims["email"], "Lista över nya lösenord till " + str + " elever",
                        $"Hej {claims["displayname"]}!<br/> Här bifogas PDF document filen med nya lösenord till elever från klass {str}.",
                        claims["email"] ?? "", _session?.GetString("Password") ?? "", attachedFile);

            if (!success)
            {
                return _help.Error("UsersController: SendEmail",
                    $"Det gick inte att skicka e-post med pdf dokument till e-postadress {claims["email"]}. {MailService._message}");
            }
        }
        catch (Exception ex)
        {
            return _help.Error("UserController: SendEmail", ex.Message);
        }

        return new(new { result = true });
    }
    #endregion

    #region Helpers
    // Return extension of User
    public UserViewModel UpdatedUser([FromBody] UserViewModel user)
    {
        user.Credentials = new UserCredentials
        {
            Username = _help.GetClaim("Username"),
            Password = _session.GetString("Password")
        };

        return user;
    }

    // Return information
    public Data GetLogData()
    {
        var ip = Request.HttpContext.Connection.RemoteIpAddress?.ToString();

        // Get computer name
        IPHostEntry GetIPHost = Dns.GetHostEntry(IPAddress.Parse(ip));
        List<string> compName = [.. GetIPHost.HostName.ToString().Split('.')];
        string pcName = compName.First();
        //string computerName = (Environment.MachineName ?? System.Net.Dns.GetHostName() ?? Environment.GetEnvironmentVariable("COMPUTERNAME"));

        var claims = _help.GetClaims("office", "department") ?? [];
        try
        {
            return new Data
            {
                Office = claims["office"],
                Department = claims["department"],
                ManagedUserOffice = _session.GetString("ManagedOffice"),
                ManagedUserDepartment = _session.GetString("ManagedDepartment"),
                Group = _session.GetString("GroupName"),
                ComputerName = pcName,
                IpAddress = _contextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString()
            };
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
        }

        return new Data();
    }

    // Save update statistik
    public async Task SaveUpdateStatitics([FromBody] string param, int count)
    {
        try
        {
            var year = DateTime.Now.Year;
            var month = DateTime.Now.ToString("MMMM", CultureInfo.InvariantCulture);

            var passChange = (param == "PasswordsChange");

            var statistics = IHelpService.GetListFromFile<Statistics>("statistics");
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

            await IHelpService.SaveUpdateFile(statistics, "statistics");

        }
        catch (Exception ex)
        {
            _help.SaveLogFile(["Save statistics", $"Fel: {ex.Message}"], "errors");
        }
    }

    // Save log file
    public void SaveHistoryLogFile([FromBody] Data model)
    {
        try
        {
            var user = _provider.FindUserByExtensionProperty(_help.GetClaim("Username") ?? "");
            var groupName = model?.Group?.ToLower();
            string fileName = (groupName ?? "") + "_";

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

            _help.SaveLogFile(contentList, "history");
        }
        catch (Exception ex)
        {
            _help.SaveLogFile(["SaveLogFile", $"Fel: {ex.Message}"], "errors");
        }
    }
    #endregion
}
