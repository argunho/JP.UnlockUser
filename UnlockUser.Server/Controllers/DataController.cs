using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Diagnostics;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DataController(IHelpService helpService, IActiveDirectory provider, ICredentialsService credentials,
                                ILocalFileService localFileService, IConfiguration config) : ControllerBase
{
    private readonly IHelpService _helpService = helpService;
    private readonly IActiveDirectory _provider = provider;
    private readonly ICredentialsService _credentials = credentials;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IConfiguration _config = config;

    #region GET
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetGroupUsers()
    {
        try
        {
            Dictionary<string, List<UserViewModel>> data = [];
            var claims = _credentials.GetClaims(["username", "access", "permissions"], Request);

            List<GroupModel> claimGroups = JsonConvert.DeserializeObject<List<GroupModel>>(claims!["permissions"]) ?? [];
            List<string?> sessionUserGroups = [.. claimGroups?.Select(s => s.Name)!];

            List<GroupModel> passwordManageGroups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];

            var cachedEmployees = _localFileService.GetListFromFile<UserViewModel>("employees") ?? [];
            bool accessGroup = !string.IsNullOrEmpty(claims["access"]);

            var sessionUserPermissions = cachedEmployees.FirstOrDefault(x => x.Name == claims["username"])?.Permissions;
            foreach (var group in passwordManageGroups)
            {
                if (!accessGroup && !sessionUserGroups.Contains(group.Name, StringComparer.OrdinalIgnoreCase))
                    continue;

                List<string>? alternativeParams = [];
                bool isStudents = string.Equals(group.Group, "Students", StringComparison.OrdinalIgnoreCase);

                if (!accessGroup)
                {
                    if (isStudents)
                        alternativeParams = sessionUserPermissions!.Offices;
                    else
                        alternativeParams = sessionUserPermissions!.Managers;
                }

                var users = (_provider.GetUsersByGroupName(group, alternativeParams))?.Select(s => new UserViewModel(s)).ToList();
                var usersByGroup = cachedEmployees.Where(x => x.Permissions!.PasswordManageGroups.Contains(group.Name, StringComparer.OrdinalIgnoreCase)).ToList();
                for (int i = 0; i < usersByGroup.Count; i++)
                {
                    var userByGroup = usersByGroup[i];
                    var user = users?.FirstOrDefault(x => x.Name == userByGroup.Name);
                    if (user == null)
                        continue;

                    user.Permissions = userByGroup.Permissions;
                }

                _ = users!.ConvertAll(x => x.Group = group.Name);

                if (!isStudents)
                    _ = users!.ConvertAll(x => x.PasswordLength = 12).ToList();

                data.Add(group.Name?.ToLower()!, users!);
            }

            return Ok(data);
        }
        catch (Exception ex)
        {
            return Ok(await _helpService.Error(ex));;
        }
    }

    // Get schools list
    [HttpGet("schools")]
    public IActionResult GetSchools()
    {
        var list = _localFileService.GetListFromFile<School>("schools").Select(s => new ListViewModel
        {
            Id = s.Name,
            Primary = s.Name,
            Secondary = s.Place
        }).ToList();

        return Ok(new { list });
    }

    // Get all txt files
    [HttpGet("logs/history")]
    public async Task<IActionResult> GetTextFiles()
    {
        try
        {
            var logs = Directory.GetFiles(@"wwwroot/logs/history", "*.txt", SearchOption.AllDirectories).ToList();

            // Remove old files
            if (logs != null && logs?.Count > 0)
            {
                var oldFiles = logs.Where(x => System.IO.File.GetLastWriteTime(x).AddMonths(3).Ticks < DateTime.Now.Ticks).ToList();
                if (oldFiles.Count > 0)
                {
                    for (var x = 0; x < oldFiles.Count; x++)
                    {
                        var log = logs[x];
                        FileInfo fi = new(log);
                        if (fi != null)
                        {
                            System.IO.File.Delete(log);
                            fi.Delete();
                            logs.Remove(log);
                        }
                    }
                }
            }

            logs = logs?.OrderByDescending(x => System.IO.File.GetLastWriteTime(x).Ticks)?
                            .Select(x => x.Replace("\\", "/")[(x.LastIndexOf('/') + 1)..].Replace(".txt", "")).ToList() ?? null;

            return Ok(new { list = logs });
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex));;
        }
    }

    // Get file to download
    [HttpGet("read/file/{directory}/{id}")]
    public async Task<IActionResult> ReadTextFile(string directory, string id)
    {
        var path = Path.Combine($@"wwwroot/logs/{directory}", $"{id}.txt");
        try
        {
            var content = System.IO.File.ReadAllText(path);
            return Ok(content);
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex));;
        }
    }

    // Get statistics
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        try
        {
            List<Statistics> data = _localFileService.GetListFromFile<Statistics>("statistics");
            List<ListViewModel> list = [.. data?.OrderBy(x => x.Year).Select(s => new ListViewModel {
                Primary = s.Year.ToString(),
                Secondary = $"Byten lösenord: {s.Months.Sum(s => s.PasswordsChange)}, Upplåst konto: {s.Months.Sum(s => s.Unlocked)}",
                IncludedList = [.. s.Months.OrderBy(o => o.Name).Select(s => new ListViewModel {
                    Primary = s.Name,
                    Secondary = $"Byten lösenord: {s.PasswordsChange}, Upplåst konto: {s.Unlocked}"
                })]
            })!];

            int passwordChange = 0;
            int unlockedAccount = 0;
            foreach (var year in data)
            {
                foreach (var month in year.Months)
                {
                    passwordChange += month.PasswordsChange;
                    unlockedAccount += month.Unlocked;
                }
            }

            return new JsonResult(new { list, count = $"Byten lösenord: {passwordChange}, Upplåst konto: {unlockedAccount}" });
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex));;
        }
    }
    #endregion

    #region POST
    [HttpPost("schools")]
    public async Task<IActionResult> PostSchool(School school)
    {
        try
        {
            var schools = _localFileService.GetListFromFile<School>("schools");
            if (schools.Count == 0)
                schools = _localFileService.GetJsonFile<School>("schools");
            schools.Add(school);
            await Task.Delay(1000);

            await _localFileService.SaveUpdateFile(schools, "schools");

            return Ok(GetSchools());
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex));;
        }
    }
    #endregion

    #region DELETE
    [HttpDelete("schools/{name}")]
    public async Task<IActionResult> DeleteSchool(string name)
    {
        try
        {
            var schools = _localFileService.GetListFromFile<School>("schools");
            schools.RemoveAll(x => x.Name == name);
            await Task.Delay(1000);
            await _localFileService.SaveUpdateFile(schools, "schools");
        return Ok();
        }
        catch (Exception ex)
        {

            return BadRequest(await _helpService.Error(ex));;
        }
    }
    #endregion
}
