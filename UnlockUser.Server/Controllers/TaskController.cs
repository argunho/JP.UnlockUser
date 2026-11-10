using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TaskController(ILocalUserService localUserService, IHelpService helpService,
    DashboardService dashboardService, IConfiguration config, ILogger<TaskController> logger) : ControllerBase
{
    private readonly ILocalUserService _localUserService = localUserService;
    private readonly IHelpService _helpService = helpService;
    private readonly DashboardService _dashboardService = dashboardService;
    private readonly IConfiguration _config = config;
    private readonly ILogger<TaskController> _logger = logger;

    #region POST
    [HttpPost("run/{id}")]
    public async Task<IActionResult> RunTask(string id)
    {
        try
        {
            var key = $"{id}{_config["Task:Hash"]}";
            var equals = VerifyHash(_config["Task:Key"], key);
            if (!equals)
                return Ok(_helpService.Warning("Behörighet saknas."));


            await _localUserService.RenewUsersCachedList();
            await _dashboardService.CacheUsersByGroup();
            _logger.LogInformation($"Task with ID {id} executed successfully.");
            return Ok(new { message = "Task executed successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"An error occurred while executing task with ID {id}.");
            await _helpService.Error(ex);
            return StatusCode(500, new { message = $"An error occurred: {ex.Message}" });
        }
    }
    #endregion

    #region Private methods
    public string GetHash(string str)
    {
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(str));
        return Convert.ToHexString(bytes);
    }

    public bool VerifyHash(string input, string expectedHash)
    {
        string actualHash = GetHash(input);

        return string.Equals(
            actualHash,
            expectedHash,
            StringComparison.OrdinalIgnoreCase);
    }
    #endregion
}
