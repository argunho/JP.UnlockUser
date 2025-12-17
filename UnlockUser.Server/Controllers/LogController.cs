using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace UnlockUser.Server.Controllers;

[ApiController]
[Route("api/Log")]
[Route("api/Logs")]
[Authorize(Roles = "DevTeam")]
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
    public async Task<JsonResult?> GetById(string id)
    {
        try
        {
            var logs = await GetLogs();
            Log log = logs?.FirstOrDefault(x => x.Id == id) ?? new();
            if (!log.Equals(new Log()))
            {
                log.Opened = true;
                await _fileService.SaveJsonFile(logs!, "logs", @"wwwroot/json");
            }
            else
                return new(_helpService.NotFound("Log"));

            return new(log);
        }
        catch (Exception ex)
        {
            return new(new { res = await _helpService.Error($"{ctrl}: {nameof(GetById)}", ex) });
        }
    }
    #endregion

    #region DELETE
    [HttpDelete("{id}")]
    public async Task<JsonResult> Delete(string id)
    {
        try
        {
            var logs = await GetLogs();
            Log? log = logs.FirstOrDefault(x => x.Id == id);
            if (log == null)
                return new(_helpService.NotFound("Log"));

            logs.Remove(log);
            await _fileService.SaveJsonFile(logs!, "logs", @"wwwroot/json");
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
        }

        return new(null);
    }

    [HttpDelete("multiple/{ids}")]
    public async Task<JsonResult> DeleteMultiple(string? ids)
    {
        if (string.IsNullOrEmpty(ids))
            return new(_helpService.Warning());

        try
        {
            List<string>? idsToRemove = [.. ids.Split(",")];
            for (int i = 0; i < idsToRemove?.Count; i++)
            {
                await Delete(idsToRemove[i]);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
        }

        return new(null);
    }
    #endregion

    #region Help methods
    public async Task<List<Log>> GetLogs()
     => await _fileService.GetJsonFile<Log>("logs", @"wwwroot/json") ?? [];
    #endregion
}