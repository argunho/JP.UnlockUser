﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic;
using System.Diagnostics;

namespace UnlockUser.Server.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize]

public class DataController(IHelp help, IActiveDirectory provider) : ControllerBase
{
    private readonly IHelp _help = help;
    private readonly IActiveDirectory _provider = provider;

    #region GET
    [HttpGet("json/{param}")]
    public JsonResult GetLogFiles(string param)
    {
        try
        {
            List<dynamic> logs = IHelpService.GetListFromFile<dynamic>(param);
            return new JsonResult(logs);
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return new JsonResult(null);
        }
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

            return new JsonResult(logs);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"{nameof(GetTextFiles)} Fel: {ex.Message}");
            return new JsonResult(null);
        }
    }

    // Get schools list
    [HttpGet("schools")]
    public List<ListViewModel>? GetListByName()
    {
        var list = IHelpService.GetListFromFile<School>("schools").Select(s => new ListViewModel
        {
            Id = s.Name,
            Primary = s.Name,
            Secondary = s.Place
        }).ToList();

        return list;
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
    public List<ListViewModel> GetStatistics()
    {
        try
        {
            List<Statistics> schools = IHelpService.GetListFromFile<Statistics>("statistics");
            return [.. schools?.OrderBy(x => x.Year).Select(s => new ListViewModel {
                Primary = s.Year.ToString(),
                Secondary = $"Byten lösenord: {s.Months.Sum(s => s.PasswordsChange)}, Upplåst konto: {s.Months.Sum(s => s.Unlocked)}",
                IncludedList = [.. s.Months.OrderBy(o => o.Name).Select(s => new ListViewModel {
                    Primary = s.Name,
                    Secondary = $"Byten lösenord: {s.PasswordsChange}, Upplåst konto: {s.Unlocked}"
                })]
            })];
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return [];
        }
    }
    #endregion

    #region POST
    [HttpPost("schools")]
    public async Task<IActionResult> PostSchool([FromBody] School school)
    {
        try
        {
            var schools = IHelpService.GetListFromFile<School>("schools");
            schools.Add(school);
            await IHelpService.SaveUpdateFile<School>(schools, "schools");
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
            var schools = IHelpService.GetListFromFile<School>("schools");
            schools.RemoveAll(x => x.Name == name);
            await IHelpService.SaveUpdateFile<School>(schools, "schools");
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
    public string? GetClaim([FromBody] string? name)
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
    #endregion
}
