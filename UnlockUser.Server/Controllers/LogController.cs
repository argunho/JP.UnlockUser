using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace UnlockUser.Server.Controllers;

[ApiController]
[Route("api/Log")]
[Route("api/Logs")]
[Authorize(Roles = "DevelopeTeam")]
public class LogController(IHelpService helpService, IFileService fileService) : ControllerBase
{
    private readonly IHelpService _helpService = helpService ?? throw new ArgumentNullException(nameof(helpService));
    private readonly IFileService _fileService = fileService ?? throw new ArgumentNullException(nameof(fileService));

    #region GET
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        List<LogViewModel> logs = [];
        try
        {
            logs = await GetLogs();
            if (logs.Count > 0)
                logs = [.. logs.OrderByDescending(x => x.Date)];
        }
        catch (Exception ex)
        {
            await _helpService.Error(ex);
        }

        return Ok(logs);
    }

    [HttpGet("by/{id}")]
    public async Task<IActionResult?> GetById(string id)
    {
        try
        {
            var logs = await GetLogs();
            LogViewModel log = logs?.FirstOrDefault(x => x.Id == id) ?? new();
            if (!log.Equals(new LogViewModel()))
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
            return BadRequest(await _helpService.Error(ex)); ;
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
            LogViewModel? log = logs.FirstOrDefault(x => x.Id == id);
            if (log == null)
                return NotFound(_helpService.NotFound("Log"));

            logs.Remove(log);
            string logsJson = JsonSerializer.Serialize(logs);
            await _fileService.SaveFile(logsJson!, "logs", @"wwwroot/json");
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex)); ;
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
            return BadRequest(await _helpService.Error(ex)); ;
        }
    }
    #endregion

    #region Help methods
    public async Task<List<LogViewModel>> GetLogsOneByOne()
    {
        List<LogViewModel> logs = [];
        var logFiles = Directory.GetFiles(@"wwwroot/logs", "*.txt", SearchOption.AllDirectories);
        if (logFiles.Length == 0)
            return logs;

        foreach (var file in logFiles)
        {
            try
            {
                var json = await System.IO.File.ReadAllTextAsync(file);

                if (string.IsNullOrEmpty(json))
                    continue;

                var log = JsonSerializer.Deserialize<LogViewModel>(json);
                if (log != null)
                    logs.Add(log);

            }
            catch (Exception ex)
            {
                await _helpService.Error(ex);
            }
        }

        return logs;
    }

    public async Task<List<LogViewModel?>> GetLogs()
    {
        var logFiles = Directory.GetFiles(@"wwwroot/logs", "*.txt", SearchOption.AllDirectories);

        var logs = logFiles.Select(async file =>
        {
            try
            {
                var json = await System.IO.File.ReadAllTextAsync(file);

                if (string.IsNullOrWhiteSpace(json))
                    return null;

                return JsonSerializer.Deserialize<LogViewModel>(json);
            }
            catch
            {
                return null;
            }
        });

        var results = await Task.WhenAll(logs) ?? [];

        return [.. results.Where(x => x != null)];
    }
    #endregion
}