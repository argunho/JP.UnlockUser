﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace UnlockUser.Server.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize]
public class DataController(IConfiguration config, IHttpContextAccessor contextAccessor) : ControllerBase
{
    private readonly IConfiguration _config = config; // Implementation of configuration file => ActiveDerictory/appsettings.json
    private readonly IHttpContextAccessor _contextAccessor = contextAccessor;
    private readonly ISession _session = contextAccessor.HttpContext.Session;

    #region GET
    // Get all files
    [HttpGet("logFiles")]
    public JsonResult GetLogFiles()
    {
        var path = @"wwwroot/logfiles/";
        try
        {
            var logs = Directory.GetFiles(path, "*.txt", SearchOption.AllDirectories).ToList();

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
        catch (Exception e)
        {
            Debug.WriteLine(e.Message);
            return new JsonResult(null);
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
}
