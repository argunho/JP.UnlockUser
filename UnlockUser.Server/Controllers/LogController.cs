using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Diagnostics;

namespace UnlockUser.Server.Controllers;

[ApiController]
[Route("api/Log")]
[Route("api/Logs")]
[Authorize(Roles = "DevelopeTeam")]
public class LogController(IHelpService helpService, IFileService fileService) : ControllerBase
{
    private readonly IHelpService _helpService = helpService ?? throw new ArgumentNullException(nameof(helpService));
    private readonly IFileService _fileService = fileService ?? throw new ArgumentNullException(nameof(fileService));

    private readonly string ctrl = nameof(LogController);

    #region GET
    [HttpGet]
    public async Task<List<Log>> Get()
    {
        List<Log> logs = [];
        try
        {
            logs = await GetLogs();
            if (logs.Count > 0)
                logs = [.. logs.OrderByDescending(x => x.Date)];
        }
        catch (Exception ex)
        {
            await _helpService.Error($"{ctrl}: {nameof(Get)}", ex);
        }

        return logs;
    }

    [HttpGet("by/{id}")]
    public async Task<IActionResult?> GetById(string id)
    {
        try
        {
            var logs = await GetLogs();
            Log log = logs?.FirstOrDefault(x => x.Id == id) ?? new();
            if (!log.Equals(new Log()))
            {
                log.Opened = true;
                string logsJson = System.Text.Json.JsonSerializer.Serialize(logs);
                await _fileService.SaveFile(logsJson!, "logs", @"wwwroot/json");
            }
            else
                return NotFound(_helpService.NotFound("Log"));

            return Ok(log);
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error($"{ctrl}: {nameof(GetById)}", ex));;
        }
    }
    #endregion

    #region DELETE
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            var logs = await GetLogs();
            Log? log = logs.FirstOrDefault(x => x.Id == id);
            if (log == null)
                return NotFound(_helpService.NotFound("Log"));

            logs.Remove(log);
            string logsJson = System.Text.Json.JsonSerializer.Serialize(logs);
            await _fileService.SaveFile(logsJson!, "logs", @"wwwroot/json");
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error($"{ctrl}: {nameof(Delete)}", ex));;
        }
    }

    [HttpDelete("multiple/{ids}")]
    public async Task<IActionResult> DeleteMultiple(string? ids)
    {
        try
        {
            if (string.IsNullOrEmpty(ids))
                return NotFound(_helpService.Warning());

            List<string>? idsToRemove = [.. ids.Split(",")];
            for (int i = 0; i < idsToRemove?.Count; i++)
            {
                await Delete(idsToRemove[i]);
            }
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error($"{ctrl}: {nameof(DeleteMultiple)}", ex));;
        }
    }
    #endregion

    #region Help methods
    public async Task<List<Log>> GetLogs()
    {
        List<Log> logs = [];
        var logFiles = Directory.GetFiles(@"wwwroot/logs", "*.txt", SearchOption.AllDirectories).ToList();
        if (logFiles.Count == 0)
            return logs;

        for (int i = 0; i < logFiles.Count; i++)
        {
            var log = JsonConvert.DeserializeObject<Log>(await System.IO.File.ReadAllTextAsync(logFiles[i]));
            logs.Add(log);
        }

        return logs;
    }
    #endregion
}