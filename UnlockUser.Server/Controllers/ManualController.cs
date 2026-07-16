using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ManualController(IHelpService helpService) : ControllerBase
{
    private readonly IHelpService _help = helpService;

    #region GET
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        List<ManualArticleViewModel> manuals = [];

        try
        {
            var (pathName, filePaths) = GetFiles();
            manuals = await GetFileViewModels([.. filePaths]);
        }
        catch (Exception ex)
        {
            await _help.Error(ex);
        }

        return Ok(manuals.OrderBy(x => x.FileName).ToList());
    }

    [HttpGet("byname/{name}")]
    public async Task<IActionResult> GetByName(string name)
    {
        try
        {
            var (_, files) = GetFiles();
            var file = files.FirstOrDefault(f =>
                Path.GetFileNameWithoutExtension(f).Contains(name, StringComparison.OrdinalIgnoreCase));

            if (file == null)
                return Ok(_help.NotFound("Filen"));

            var fileContent = await System.IO.File.ReadAllTextAsync(file);
            var fileName = Path.GetFileNameWithoutExtension(file);

            return Ok(new ManualArticleViewModel
            {
                Id = _help.EncodeToBase64(Path.GetFileName(file)),
                Name = fileName[(fileName.IndexOf('.') + 1)..],
                Html = fileContent,
                FileName = fileName
            });
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var filePath = await GetFilePath(id);
        if (string.IsNullOrEmpty(filePath))
            return Ok(_help.NotFound("Filen"));

        var foundFile = await System.IO.File.ReadAllTextAsync(filePath);
        var name = Path.GetFileNameWithoutExtension(filePath).ToString();

        var manual = new ManualArticleViewModel
        {
            Id = _help.EncodeToBase64(Path.GetFileName(filePath)),
            Name = name[(name.IndexOf('.') + 1)..].Replace("_", " "),
            Html = foundFile
        };

        return Ok(manual);
    }
    #endregion

    #region POST
    // Save uploaded file docx
    [HttpPost]
    public async Task<IActionResult> Post(ManualArticleViewModel model)
    {
        if (!ModelState.IsValid)
            return Ok(_help.Warning());

        try
        {
            var (pathName, files) = GetFiles();
            int index = files.Count() - 1;

            var name = $"{index}.{_help.CleanString(model.Name!.Replace(" ", "_"))}.txt";

            pathName = Path.Combine(pathName, name);
            if (System.IO.File.Exists(pathName))
                return Conflict("File already exists");

            await System.IO.File.WriteAllTextAsync(pathName, model.Html);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }

    [HttpPost("sorting")]
    public async Task<IActionResult> PostSortByIndex(List<string> names)
    {
        try
        {
            var (pathName, files) = GetFiles();
            for (int i = 0; i < names.Count; i++)
            {
                string name = names[i];
                foreach (var file in files)
                {
                    string fileName = Path.GetFileName(file);
                    if (fileName.Contains(name, StringComparison.OrdinalIgnoreCase))
                    {
                        string newFileName = $"{i}.{fileName[(fileName.IndexOf('.') + 1)..]}";

                        string directory = Path.GetDirectoryName(file)!;
                        string newFullPath = Path.Combine(directory, newFileName);

                        // rename file (content stays the same)
                        if (!System.IO.File.Exists(newFullPath))
                        {
                            System.IO.File.Move(file, newFullPath);
                        }
                    }
                }
            }

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }
    #endregion

    #region PUT
    [HttpPut("{id}")]
    public async Task<IActionResult> Put(string id, ManualArticleViewModel model)
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

    private (string pathName, IEnumerable<string>) GetFiles(string directory = "manual")
    {
        var source = Path.Combine("wwwroot", directory);
        if (!Directory.Exists(source))
            Directory.CreateDirectory(source);

        var files = Directory.EnumerateFiles(source, "*.txt");

        return (source, files);
    }

    private async Task<List<ManualArticleViewModel>> GetFileViewModels(List<string> filePaths)
    {
        var models = new List<ManualArticleViewModel>();
        foreach (var filePath in filePaths)
        {
            var fileContent = await System.IO.File.ReadAllTextAsync(filePath);
            var name = Path.GetFileNameWithoutExtension(filePath).ToString();
            models.Add(new ManualArticleViewModel
            {
                Id = _help.EncodeToBase64(Path.GetFileName(filePath)),
                Name = name[(name.IndexOf('.') + 1)..],
                Html = fileContent,
                FileName = name
            });
        }

        return models;
    }
    #endregion
}

