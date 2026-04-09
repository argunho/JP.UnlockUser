using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics.CodeAnalysis;

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
                    Id = _help.EncodeToBase64(Path.GetFileName(filePath)),
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
        var filePath = await GetFilePath(id);
        if(string.IsNullOrEmpty(filePath))
            return Ok(_help.NotFound("Filen"));

        var foundFile = await System.IO.File.ReadAllTextAsync(filePath);

        var manual = new Manual
        {
            Id = _help.EncodeToBase64(Path.GetFileName(filePath)),
            Name = Path.GetFileNameWithoutExtension(filePath),
            Html = foundFile
        };

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

            var name = $"{_help.CleanString(model.Name!.Replace(" ", "_"))}.txt";

            path = Path.Combine(path, name);
            if (System.IO.File.Exists(path))
                return Conflict("File already exists");

            await System.IO.File.WriteAllTextAsync(path, model.Html);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }
    #endregion

    #region PUT
    [HttpPut]
    public async Task<IActionResult> Put(string id, Manual model)
    {
        if (!ModelState.IsValid)
            return Ok(_help.Warning());

        try
        {
            var filePath = await GetFilePath(id);
            if (string.IsNullOrEmpty(filePath))
                return Ok(_help.NotFound("Filen"));


            await System.IO.File.WriteAllTextAsync(filePath, model.Html);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }
    #endregion

    #region DELETE
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            var filePath = await GetFilePath(id);
            if (string.IsNullOrEmpty(filePath))
                return Ok(_help.NotFound("Filen"));

            System.IO.File.Delete(filePath);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }
    #endregion

    #region Helper methods
    public async Task<string?> GetFilePath(string id)
    {
        string filePath = _help.DecodeFromBase64(id);
        string pathName = Path.Combine("wwwroot", "manual", filePath);
        if (!System.IO.File.Exists(pathName))
            return null;

        return pathName;
    }
    #endregion
}

