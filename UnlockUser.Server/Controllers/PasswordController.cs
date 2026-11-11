using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Moderator")]
[Authorize(Policy = "NotImpersonating")]
public class PasswordController(IADService provider, IWebHostEnvironment env,
    ILocalFileService localFileService, IHelpService helpService, ICredentialsService credinalService, 
    ILocalMailService localMailService, IGoogleService googleService,
    ILogger<PasswordController> logger) : ControllerBase
{
    private readonly IADService _provider = provider;
    private readonly IWebHostEnvironment _env = env;
    private readonly IHelpService _help = helpService;
    private readonly ILocalFileService _localFile = localFileService;
    private readonly ICredentialsService _credentials = credinalService;
    private readonly ILocalMailService _localMail = localMailService;
    private readonly IGoogleService _google = googleService;
    private readonly ILogger<PasswordController> _logger = logger;

    #region POST
    [HttpPost("reset/single")]
    public async Task<IActionResult> SetSinglePassword(UserFormModel model)
    {
        try
        {
            EnsureNotImpersonating(); // 2026-09-08

            List<UserFormModel> models = [model];

            if (model.IsEmployee)
                await SetActiveDirectoryPasswords(models);
            else
                await StudentsPasswordChenge(models);

            return Ok(new { color = "success", success = true, msg = "Lösenordsåterställningen lyckades!" });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("reset/multiple")] 
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
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("reset/send/to/email")]
    public async Task<IActionResult> SetPasswordsSavePdf([FromForm] IFormFile file, [FromForm] string data, [FromForm] string label)
    {
        try
        {
            EnsureNotImpersonating(); // 2026-09-08

            data = Uri.UnescapeDataString(data);
            List<UserFormModel>? models = JsonSerializer.Deserialize<List<UserFormModel>>(
                data,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            await StudentsPasswordChenge(models);

            if (file != null && file.Length > 0)
            {
                // Implementation of MailRepository class where email content is structured and SMTP connection with credentials
                var claims = _credentials.GetClaims(["email", "displayname"]) ?? [];

                await _localMail.SendMail([claims["email"]], file!.FileName.Replace(".pdf", ""),
                            $"Hej {claims["displayname"]}!<br/> Här bifogas PDF document filen med nya lösenord till elever från {label}.", file);
            }
            else
                return Ok(_help.Warning("Lösenordsåterställningen lyckades utan att skicka pdf filen till e-postadress."));

            return Ok(new { color = "success", success = true, msg = "Lösenordsåterställningen lyckades!" });
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }
    #endregion

    #region Helpers
    // Return information
    private async Task<Data> GetLogData([FromBody] string group, [FromBody] string office, [FromBody] string department)
    {

        var claims = _credentials.GetClaims(["office", "department"]) ?? [];
        var data = new Data();
        string pcName = "Unknown";

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        if (string.IsNullOrEmpty(ipAddress))
        {
            var ipHeader = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            ipAddress = ipHeader?.Split(',').First().Trim();
        }

        // Get computer name
        try
        {
            if (IPAddress.TryParse(ipAddress, out var addr))
                pcName = (await Dns.GetHostEntryAsync(addr))
                    .HostName
                    .Split('.', StringSplitOptions.RemoveEmptyEntries)
                    .FirstOrDefault() ?? pcName;
        }
        catch { }

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
        if (!string.IsNullOrEmpty(_credentials.GetClaim("impersonating")))
            throw new Exception("Lösenordsändring är inte tillåten i granskningsläge.");
    }
    // end

    // Set multiple passwords
    private async Task SetActiveDirectoryPasswords(List<UserFormModel> models)
    {
        // Check model is valid or not and return warning is true or false
        var userModel = models[0] ?? throw new Exception("Person för lösenordsåterställning har inte specificerats.");

        // If password needs to confirm
        if (!string.IsNullOrEmpty(userModel.ConfirmPassword)
            && !string.Equals(userModel.Password, userModel.ConfirmPassword))
            throw new Exception("Lösenord och bekräftelse av lösenord matchar inte.");

        // Current moderator claims
        var claims = _credentials.GetClaims(["groups", "roles", "username"]);
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
            var moderators = await _localFile.GetEncryptedFile<List<Models.User>>("catalogs/moderators");
            var permissions = moderators?.FirstOrDefault(x => x.Username != null
                            && x.Username.Equals(username, StringComparison.OrdinalIgnoreCase))?.Permissions;

            string warningMessage = "Behörigheter saknas att ändra lösenord för";
            if (group!.Equals("Studenter", StringComparison.OrdinalIgnoreCase))
            {
                if (!permissions!.Schools.Any(s => office!.StartsWith(s, StringComparison.OrdinalIgnoreCase)))
                    throw new Exception($"{warningMessage} {department} {office}");
            }
            else
            {
                var pe = permissions?.Employees ?? [];
                var po = permissions?.Offices ?? [];

                bool isModerator = moderators!.Exists(x => x.Username!.Equals(userModel.Username, StringComparison.OrdinalIgnoreCase));
                bool isApproved = pe!.Contains(userModel.Username, StringComparer.OrdinalIgnoreCase) || po!.Contains(userModel.Office, StringComparer.OrdinalIgnoreCase);

                if (!isApproved)
                {
                    if (string.IsNullOrEmpty(userModel.Manager) || isModerator)
                    {
                        throw new Exception($"{warningMessage} {userModel.Username}");
                    }
                    else
                    {
                        var match = Regex.Match(userModel.Manager!, @"^CN=([^,]+)");
                        string? userManager = match.Success ? match.Groups[1]?.Value : null;

                        if (string.IsNullOrEmpty(userManager) || (!permissions!.Managers.Contains(userManager, StringComparer.OrdinalIgnoreCase)
                            && !userManager.Equals(username, StringComparison.OrdinalIgnoreCase)))
                        {
                            throw new Exception($"{warningMessage} {userModel.Username}");
                        }
                    }
                }
            }
        }

        _logger.LogTrace("Password change initiated at {dateTime}. Moderator: {user}", DateTime.Now.ToString("g"), username);

        Data history = await GetLogData(group!, office!, department!);
        var message = new StringBuilder();

        _logger.LogTrace("Permissions validated. Starting to set a new password for {users} at {dateTime}.",
            string.Join(",", models.Select(s => s.Username).ToList()), DateTime.Now.ToString("g"));


        var usersNotFound = new List<string>();
        // Set password to class students
        foreach (var user in models!)
        {
            // Most relevant for students
            if (string.IsNullOrEmpty(user.Username))
            {
                var userData = _provider.FindUser(user.Email!);
                if (userData == null)
                {
                    usersNotFound.Append(user.Name);
                    continue;
                }
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

        _logger.LogTrace("Password change finished at {dateTime}. Moderator: {user}", DateTime.Now.ToString("g"), username);

        if (usersNotFound.Count > 0)
        {
            throw new Exception($"Det gick inte att hitta användare{(usersNotFound.Count > 1 ? "" : 'n')} {string.Join(',', usersNotFound)} för att ändra lösenordet i AD.\n");
        }
    }

    private async Task StudentsPasswordChenge(List<UserFormModel> models)
    {
        var username = _credentials.GetClaim("username");
        try
        {
            var services = models.FirstOrDefault(x => x.Services != null)?.Services ?? [];
            if (services.Count == 0)
            {
                await _google.UpdatePaswords(models);
                await SetActiveDirectoryPasswords(models);
            }
            else if (services.Count > 0 && !services.Contains("Google", StringComparer.OrdinalIgnoreCase)
                && !services.Contains("AD", StringComparer.OrdinalIgnoreCase))
            {
                throw new Exception("Ingen tjänst har valts för lösenordsändring!");
            }
            else
            {
                if (services.Contains("Google", StringComparer.OrdinalIgnoreCase))
                {
                    await _google.UpdatePaswords(models);
                }

                if (services.Contains("AD", StringComparer.OrdinalIgnoreCase))
                {
                    await SetActiveDirectoryPasswords(models);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"{nameof(SetPasswordsSavePdf)}. User: {username}.  Error: {ex.Message}");
            throw new Exception($"Lösenordsändring misslyckades. {ex.Message}"); // Kontakta IT-supporten!");
        }
    }

    // Save update statistik
    private async Task SaveUpdateStatistics(string param, int count)
    {
        try
        {
            var year = DateTime.Now.Year;
            var month = DateTime.Now.ToString("MMMM", CultureInfo.InvariantCulture);

            var passChange = (param == "PasswordsChange");

            var statistics = await _localFile.GetEncryptedFile<List<Statistics>>("catalogs/statistics") ?? [];
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

            await _localFile.EncrypteToFile(statistics, "catalogs/statistics");
        }
        catch (Exception ex)
        {
            _logger.LogError("Unable to save the statistics file! Error: {error}", ex.Message);
            await _help.Error(ex);
        }
    }

    // Save log file
    private async Task SaveHistoryLogFile(Data model)
    {
        try
        {
            var user = _provider.FindUser(_credentials.GetClaim("username") ?? "");
            if (user == null)
                return;

            var description = new StringBuilder();
            description.Append("\r\n <b>Administratör som utförde lösenordsändring</b>");
            description.Append($"\n - Användarnamn: {user?.Name}");
            description.Append($"\n - Namn: {user?.DisplayName}");
            description.Append($"\n - E-postadress: {user?.EmailAddress}");
            description.Append($"\n - Arbetsplats: {user.Department}");
            description.Append($"\n - Tjänst: {user.Title}");
            description.Append($"\n\n\r <b>Dator</b>");
            description.Append($"\n - Datornamn: {model?.ComputerName}");
            description.Append($"\n - IpAddress: {model?.IpAddress}");
            description.Append($"\n\n\r <b>Hantering</b>");
            description.Append($"\n - Gruppnamn: {model?.Group}");

            bool isStudentGroup = string.Equals(model!.Group, "studenter", StringComparison.OrdinalIgnoreCase);

            if (isStudentGroup)
            {
                description.Append($"\n  - Skolan: {model?.ManagedUserOffice}");
                description.Append($"\n  - Klassnamn: {model?.ManagedUserDepartment}");
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
                description.Append($"\n - Arbetsplats: {model?.Office}");
                description.Append($"\n\n\r Lösenord ändrad till:");
                description.Append($"\n\t-{model?.Group}: {model?.Users[0]}");
            }
            description.Append("\n\n\n <b>Datum:</b> " + DateTime.Now.ToString("yyyy.MM.dd HH:mm:ss"));

            var histories = await _localFile.GetEncryptedFile<List<FileViewModel>>("catalogs/histories") ?? [];
            FileViewModel hitoryData = new()
            {
                Name = $"{model!.Group}  {model.Office}",
                Description = description.ToString()
            };

            histories.Add(hitoryData);
            await _localFile.EncrypteToFile(histories, "catalogs/histories");
        }
        catch (Exception ex)
        {
            _logger.LogError("Unable to save the history file! Error: {error}", ex.Message);
            await _help.Error(ex);
        }
    }
    #endregion
}
