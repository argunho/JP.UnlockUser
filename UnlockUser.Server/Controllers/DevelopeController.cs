using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DevelopeController(IADService provider, IMemoryCache memoryCache, IGoogleService googleService, 
    IWebHostEnvironment env, ILogger<DevelopeController> logger) : ControllerBase
{
    private readonly IADService _provider = provider;
    private readonly IMemoryCache _cache = memoryCache;
    private readonly IGoogleService _googleService = googleService;
    private readonly IWebHostEnvironment _env = env;
    private readonly ILogger<DevelopeController> _logger = logger;

    #region GET
    [HttpGet("students")]
    public async Task<IActionResult> GetStudents([FromQuery] string? date, [FromQuery] bool clear = false)
    {
        if (!_env.IsDevelopment())
            return Ok();
        DateTime currentDate = DateTime.Now;
        if (date == null || Convert.ToDateTime(date).Date != currentDate.Date)
            return Ok();

        if (clear)
            ((MemoryCache)_cache).Clear();

        var users = await _googleService.GetStudentsFromGoogleApi();
        return Ok(users);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? date, [FromQuery] bool clear = false)
    {
        if (!_env.IsDevelopment())
            return Ok();
        DateTime currentDate = DateTime.Now;
        if (date == null || Convert.ToDateTime(date).Date != currentDate.Date)
            return Ok();

        if (clear)
            ((MemoryCache)_cache).Clear();

        var users = await _googleService.GetUsers();
        return Ok(users);
    }

    [HttpGet("user/by")]
    public async Task<IActionResult> GetUser(
        [FromQuery] string email,
        [FromQuery] string? date,
        [FromQuery] bool clear = false,
        [FromQuery] bool adSearch = false)
    {
        if (!_env.IsDevelopment())
            return Ok();
        DateTime currentDate = DateTime.Now;
        if (date == null || Convert.ToDateTime(date).Date != currentDate.Date)
            return Ok();

        if (clear)
            ((MemoryCache)_cache).Clear();

        if (adSearch)
        {
            var userPrincipal = _provider.FindUserByEmail(email);
            if (userPrincipal == null)
                return NotFound($"User with email '{email}' not found");
            else
            {
                var modifiedUser = new UserViewModel(new Models.User
                {
                    Username = userPrincipal.SamAccountName,
                    DisplayName = userPrincipal.DisplayName,
                    Title = userPrincipal.Title,
                    IdentityNumber = userPrincipal.IdentityNumber,
                    Email = userPrincipal.Email,
                    Office = userPrincipal.Office,
                    Department = userPrincipal.Department,
                    Division = userPrincipal.Division,
                    Manager = userPrincipal.Manager,
                    IsLocked = userPrincipal.AccountLockoutTime != null
                });

                return Ok(modifiedUser);
            }
        }

        var user = await _googleService.GetUser(email);
        return Ok(user);
    }
    #endregion

}
