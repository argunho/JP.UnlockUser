using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ManualController(IHelpService help) : ControllerBase
{
    private readonly IHelpService _help = help;

    #region GET
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        List<Manual> manuals = [];
        string pathName = Path.Combine("wwwroot", "manual");

        if (!Directory.Exists(pathName))
            return Ok(manuals);

        try
        {
            var files = Directory.EnumerateFiles(pathName, "*.txt");

            foreach (var filePath in files)
            {
                var fileContent = await System.IO.File.ReadAllTextAsync(filePath);
                manuals.Add(new Manual
                {
                    Name = Path.GetFileNameWithoutExtension(filePath),
                    Html = fileContent
                });
            }
        }
        catch (Exception ex)
        {
            await _help.Error(ex);
        }

        return Ok(manuals);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        string pathName = Path.Combine("wwwroot", "manual", id);
        var manual = await System.IO.File.ReadAllTextAsync(pathName);
        return Ok(manual);
    }
    #endregion

    #region POST
    // Save uploaded file docx
    [HttpPost]
    public async Task<IActionResult> Post(Manual model)
    {
        if (!ModelState.IsValid)
            return Ok(_help.Warning());

        try
        {
            var path = Path.Combine("wwwroot", "manual");
            if (!Directory.Exists(path))
                Directory.CreateDirectory(path);

            var name = $"{_help.CleanString(model.Name)}.txt";
            
            path = Path.Combine(path, name);
            if (System.IO.File.Exists(path))
                return Conflict("File already exists");

            await System.IO.File.WriteAllTextAsync(path, name);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }
    #endregion

    #region PUT
    #endregion

    #region DELETE
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            var path = Path.Combine("wwwroot", "manual", id);
            System.IO.File.Delete(path);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }
    #endregion
}

