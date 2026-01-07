using JobRelatedHelpLibrary.LibraryModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Reflection;
using System.Text;

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

            // List of groups the current user is a member of
            List<GroupModel> claimGroups = JsonConvert.DeserializeObject<List<GroupModel>>(claims!["permissions"]) ?? [];

            // List of groups the current user are member
            List<string?> sessionUserGroups = [.. claimGroups?.Select(s => s.Name)!];

            // Employee groups where each group has its own password management permissions
            List<GroupModel> passwordManageGroups = _config.GetSection("Groups").Get<List<GroupModel>>() ?? [];

            // Saved employees who have permission to manage employee passwords
            var savedEmployees = await _localFileService.GetListFromEncryptedFile<UserViewModel>("catalogs/employees") ?? [];

            // Verify the current user's membership in the support group
            bool accessGroup = !string.IsNullOrEmpty(claims["access"]);

            // Currentsession user permissions
            var sessionUserPermissions = savedEmployees.FirstOrDefault(x => x.Name == claims["username"])?.Permissions;

            // Lopp of all employees groups
            foreach (var group in passwordManageGroups)
            {
                // If the user is not a member of the support group and not a member of the current password management group, continue
                if (!accessGroup && !sessionUserGroups.Contains(group.Name, StringComparer.OrdinalIgnoreCase))
                    continue;

                // Parameters used to filter employees
                List<string>? alternativeParams = [];

                // Verify whether the current password management group is the student group
                bool isStudents = string.Equals(group.Group, "Students", StringComparison.OrdinalIgnoreCase);

                // If the user is a member of the support group
                if (!accessGroup)
                {
                    if (isStudents)
                        alternativeParams = sessionUserPermissions!.Schools;
                    else if (group.Name == "Politeker")
                        alternativeParams = sessionUserPermissions!.Politicians;
                    else
                        alternativeParams = sessionUserPermissions!.Managers;
                }

                // All users who are members of the current password management group
                var users = (_provider.GetUsersByGroupName(group, alternativeParams)).ToList();

                if(!isStudents)
                {
                    // Filter the list of saved employees according to the current password management group


                    // Update permissions in all users of the current password management group based on the filtered saved users
                    foreach (var employee in savedEmployees)
                    {
                        var user = users?.FirstOrDefault(x => x.Name == employee.Name);
                        if (user == null)
                            continue;

                        user.Permissions = employee.Permissions;
                    }
                }


                // Users model to view
                var usersViewModel = users?.Select(s => new UserViewModel(s)).ToList();

                _ = usersViewModel!.ConvertAll(x => x.Group = group.Name);

                if (!isStudents)
                    _ = usersViewModel!.ConvertAll(x => x.PasswordLength = 12).ToList();

                data.Add(group.Name?.ToLower()!, usersViewModel!);
            }

            if (accessGroup)
                return Ok(new { data, groups = passwordManageGroups.Select(s => s.Name).ToList() });

            return Ok(data);
        }
        catch (Exception ex)
        {
            return Ok(await _helpService.Error(ex)); ;
        }
    }

    // Get schools list
    [HttpGet("schools")]
    public async Task<IActionResult> GetSchools()
    {
        var schools = (await _localFileService.GetListFromEncryptedFile<School>("catalogs/schools")).Select(s => new ListViewModel
        {
            Id = s.Name,
            Primary = s.Name,
            Secondary = s.Place
        }).ToList() ?? [];

        return Ok(schools);
    }

    // Get all txt files
    [HttpGet("logs/history")]
    public async Task<IActionResult> GetTextFiles()
    {
        try
        {
            var histories = await _localFileService.GetListFromEncryptedFile<FileViewModel>("catalogs/histories");
            if (histories.Count == 0)
                return Ok();

            var historiesToView = histories?.OrderByDescending(x => x.Date).Select(s => new ListViewModel
                {
                    Id = s.Date,
                    Primary = s.Name,
                    Secondary = s.Description
                }).ToList();

            return Ok(historiesToView);
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex)); ;
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
            return BadRequest(await _helpService.Error(ex)); ;
        }
    }

    // Get statistics
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        try
        {
            List<Statistics> data = await _localFileService.GetListFromEncryptedFile<Statistics>("catacatalogs/statistics");
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

            return Ok(new { list, secondaryLabel = $"Byten lösenord: {passwordChange}, Upplåst konto: {unlockedAccount}" });
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex)); ;
        }
    }

    // Download history file
    [HttpGet("download/by/{id}")]
    public async Task<IActionResult> DownloadFile(string id)
    {
        var items = await _localFileService.GetListFromEncryptedFile<FileViewModel>("catalogs/histories");
        if (items?.Count == 0)
            return BadRequest(_helpService.Warning("File hittades inte."));

        var item = items.FirstOrDefault(x => x.Date == id);
        if (item == null)
            return BadRequest(_helpService.Warning("File hittades inte."));

        byte[] downloadBytes = Encoding.UTF8.GetBytes(item.Download);
        return File(downloadBytes, "text/plain", $"History_{item?.Date}");
    }
    #endregion

    #region POST
    [HttpPost("school")]
    public async Task<IActionResult> PostSchool(School school)
    {
        try
        {
            var schools = await _localFileService.GetListFromEncryptedFile<School>("catalogs/schools");
            if (schools.Count == 0)
                schools = _localFileService.GetJsonFile<School>("schools");
            schools.Add(school);
            await Task.Delay(1000);

            await _localFileService.SaveUpdateEncryptedFile(schools, "catalogs/schools");

            return Ok(GetSchools());
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex)); ;
        }
    }

    #endregion

    #region DELETE
    [HttpDelete("school/{name}")]
    public async Task<IActionResult> DeleteSchool(string name)
    {
        try
        {
            var schools = await _localFileService.GetListFromEncryptedFile<School>("catalogs/schools");
            schools.RemoveAll(x => x.Name == name);
            await Task.Delay(1000);
            await _localFileService.SaveUpdateEncryptedFile(schools, "catalogs/schools");
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _helpService.Error(ex)); ;
        }
    }
    #endregion
}
