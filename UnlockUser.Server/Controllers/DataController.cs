using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Diagnostics;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DataController(IHelpService helpService, IActiveDirectory provider, ICredentialsService credentials,
                                ILocalUserService localService, IConfiguration config) : ControllerBase
{
    private readonly IHelpService _helpService = helpService;
    private readonly IActiveDirectory _provider = provider;
    private readonly ICredentialsService _credentials = credentials;
    private readonly ILocalUserService _localService = localService;
    private readonly IConfiguration _config = config;

    private readonly string ctrl = nameof(DataController);

    #region GET
    [HttpGet("dashboard")]
    public async Task<JsonResult> GetGroupUsers()
    {
        Dictionary<string, List<UserViewModel>> data = [];
        var claims = _credentials.GetClaims(["username", "access", "groups"], Request);

        List<GroupModel> claimGroups = JsonConvert.DeserializeObject<List<GroupModel>>(claims!["groups"]) ?? [];
        List<string?> sessionUserGroups = [.. claimGroups?.Select(s => s.Name)!];
        try
        {
            List<GroupModel> groups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];

            foreach (var group in groups)
            {
                List<string>? alternativeParams = [];
                bool isStudents = string.Equals(group.Group, "Students", StringComparison.OrdinalIgnoreCase);

                if (string.IsNullOrEmpty(claims["access"]))
                {
                    if (!sessionUserGroups.Contains(group.Name, StringComparer.OrdinalIgnoreCase))
                        continue;

                    var user = _localService.GetUserFromFile(claims["username"]!, group.Name!);
                    if (isStudents)
                        alternativeParams = user?.Offices;
                    else
                        alternativeParams = [.. user!.Managers.Select(s => s.Username!.ToString())];
                }
                
                var users = (_provider.GetUsersByGroupName(group, alternativeParams))?.Select(s => new UserViewModel(s)).ToList();
                if (!isStudents)
                    _ = users.ConvertAll(x => x.PasswordLength = 12).ToList();

                data.Add(group.Name?.ToLower()!, users);
            }
        }
        catch (Exception ex)
        {
            return new(await _helpService.Error($"{ctrl}: {nameof(GetGroupUsers)}", ex));
        }

        return new(data);
    }


    // Get schools list
    [HttpGet("schools")]
    public List<ListViewModel>? GetSchools()
    {
        var list = HelpService.GetListFromFile<School>("schools").Select(s => new ListViewModel
        {
            Id = s.Name,
            Primary = s.Name,
            Secondary = s.Place
        }).ToList();

        return list;
    }

    // Get all txt files
    [HttpGet("logfiles/{param}")]
    public JsonResult GetTextFiles(string param)
    {
        try
        {
            var logs = Directory.GetFiles(@"wwwroot/logfiles/" + param, "*.txt", SearchOption.AllDirectories).ToList();

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
                            .Select(x => x.Replace("\\", "/")[(x.LastIndexOf("/") + 1)..].Replace(".txt", "")).ToList() ?? null;

            return new(logs);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"{nameof(GetTextFiles)} Fel: {ex.Message}");
            return new(null);
        }
    }

    // Get file to download
    [HttpGet("read/file/{directory}/{id}")]
    public ActionResult ReadTextFile(string directory, string id)
    {
        var path = Path.Combine($@"wwwroot/logfiles/{directory}", $"{id}.txt");
        try
        {
            var content = System.IO.File.ReadAllText(path);
            return Ok(content);
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return BadRequest(ex.Message);
        }
    }

    // Get statistics
    [HttpGet("statistics")]
    public JsonResult GetStatistics()
    {
        try
        {
            List<Statistics> data = HelpService.GetListFromFile<Statistics>("statistics");
            List<ListViewModel> list = [.. data?.OrderBy(x => x.Year).Select(s => new ListViewModel {
                Primary = s.Year.ToString(),
                Secondary = $"Byten lösenord: {s.Months.Sum(s => s.PasswordsChange)}, Upplåst konto: {s.Months.Sum(s => s.Unlocked)}",
                IncludedList = [.. s.Months.OrderBy(o => o.Name).Select(s => new ListViewModel {
                    Primary = s.Name,
                    Secondary = $"Byten lösenord: {s.PasswordsChange}, Upplåst konto: {s.Unlocked}"
                })]
            })];

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
            Debug.WriteLine(ex.Message);
            return new JsonResult(null);
        }
    }
    #endregion

    #region POST
    [HttpPost("schools")]
    public async Task<IActionResult> PostSchool(School school)
    {
        try
        {
            var schools = HelpService.GetListFromFile<School>("schools");
            if (schools.Count == 0)
                schools = HelpService.GetJsonFile<School>("schools");
            schools.Add(school);
            await Task.Delay(1000);

            await HelpService.SaveUpdateFile(schools, "schools");

            return Ok(GetSchools());
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Post school error: {ex.Message}");
            return BadRequest();
        }
    }
    #endregion

    #region DELETE
    [HttpDelete("schools/{name}")]
    public async Task<IActionResult> DeleteSchool(string name)
    {
        try
        {
            var schools = HelpService.GetListFromFile<School>("schools");
            schools.RemoveAll(x => x.Name == name);
            await Task.Delay(1000);
            await HelpService.SaveUpdateFile(schools, "schools");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Post school error: {ex.Message}");
            return Ok($"Något har gått snett: Fel: {ex.Message}");
        }

        return Ok();
    }
    #endregion


}
