using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace UnlockUser.Server.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize]
public class DataController(IHelp help) : ControllerBase
{
    private readonly IHelp _help = help;

    #region GET
    [HttpGet("json/{param}")]
    public JsonResult GetLogFiles(string param)
    {
        try
        {
            List<dynamic> logs = IHelpService.GetJsonList<dynamic>(param);
            return new JsonResult(logs);
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return new JsonResult(null);
        }
    }

    // Get all txt files
    [HttpGet("logifiles/{param}")]
    public JsonResult GetTextFiles(string param)
    {
        try
        {
            var logs = Directory.GetFiles($@"wwwroot/logfiles/{param}", "*.txt", SearchOption.AllDirectories).ToList();

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
                            .Select(x => x.Replace("\\", "/").Substring(x.LastIndexOf("/") + 1).Replace(".txt", "")).ToList() ?? null;

            return new JsonResult(logs);
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return new JsonResult(null);
        }
    }

    // Get schools
    [HttpGet("schools")]
    public List<School> GetSchools()
    {
        try
        {
            List<School> schools = IHelpService.GetJsonList<School>("schools");
            return [.. schools?.OrderBy(x => x.Name)];
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return [];
        }
    }

    // Get file to download
    [HttpGet("readTextFile/{id}")]
    public ActionResult ReadTextFile(string id)
    {
        var filePath = @"wwwroot/logfiles/" + id + ".txt";
        try
        {
            var content = System.IO.File.ReadAllText(filePath);
            return Ok(content);
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return BadRequest(ex.Message);
        }
    }
    #endregion

    #region POST
    [HttpPost("schools")]
    public async Task<IActionResult> PostSchool(School school)
    {
        try
        {
            var schools = GetSchools();
            schools.Add(school);
            await UpdateSchoolsJson(schools);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Post school error: {ex.Message}");
            return Ok($"Något har gått snett: Fel: {ex.Message}");
        }

        return Ok();
    }

    #endregion

    #region DELETE
    [HttpDelete("schools/{name}")]
    public async Task<IActionResult> DeleteSchool(string name)
    {
        try
        {
            var schools = GetSchools();
            schools.RemoveAll(x => x.Name == name);
            await UpdateSchoolsJson(schools);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Post school error: {ex.Message}");
            return Ok($"Något har gått snett: Fel: {ex.Message}");
        }

        return Ok();
    }
    #endregion

    #region Help
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
   
    // Update schools json
    public async Task UpdateSchoolsJson(List<School> schools)
    {
        await using FileStream stream = System.IO.File.Create(@"wwwroot/json/schools.json");
        await System.Text.Json.JsonSerializer.SerializeAsync(stream, schools);
    }
    #endregion
}
