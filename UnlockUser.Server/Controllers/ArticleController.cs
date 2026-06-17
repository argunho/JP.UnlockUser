using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UnlockUser.Server.Controllers;

[Route("api/article")]
[Route("api/articles")]
[ApiController]
[Authorize]
public class ArticlelController(IHelpService helpService, ICredentialsService credentialsService) : ControllerBase
{
    private readonly IHelpService _help = helpService;
    private readonly ICredentialsService _credentials = credentialsService;

    private static readonly object _lock = new();

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

    [HttpGet("message")]
    public async Task<IActionResult> GetMessage()
    {
        var (_, files) = GetFiles("message");
        if (files == null || !files.Any())
            return Ok();


        string? username = _credentials.GetClaim("username");
        if (string.IsNullOrEmpty(username))
            return Ok();

        bool shouldShow = false;

        string jsonFolder = Path.Combine(@"wwwroot", "json");
        string jsonPathName = Path.Combine(jsonFolder, "watched.json");

        lock (_lock)
        {

            if (!Directory.Exists(jsonFolder))
                Directory.CreateDirectory(jsonFolder);

            if (!System.IO.File.Exists(jsonPathName))
                System.IO.File.WriteAllText(jsonPathName, "[]");

            string json = System.IO.File.ReadAllText(jsonPathName);

            HashSet<string> watched;
            try
            {
                watched = string.IsNullOrEmpty(json)
                ? new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                : System.Text.Json.JsonSerializer.Deserialize<HashSet<string>>(json)
                  ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            }
            catch (System.Text.Json.JsonException)
            {
                watched = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            }

            if (!watched.Contains(username))
            {
                watched.Add(username);
                shouldShow = true;

                var updatedJson = System.Text.Json.JsonSerializer.Serialize(watched);
                System.IO.File.WriteAllText(jsonPathName, updatedJson);
            }
        }

        if (!shouldShow)
            return Ok();

        string? jsonFile = files.FirstOrDefault()!.ToString();
        var messageFile = await System.IO.File.ReadAllTextAsync(jsonFile!);
        var messageModel = new MessageViewModel
        {
            Name = Path.GetFileNameWithoutExtension(jsonFile).ToString().Replace("_", " "),
            Html = messageFile
        };

        return Ok(messageModel);
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
            Name = name[(name.IndexOf('.') + 1)..],
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
        string pathName = Path.Combine("wwwroot", "articles", filePath);
        if (!System.IO.File.Exists(pathName))
            return null;

        return pathName;
    }

    private (string pathName, IEnumerable<string>) GetFiles(string directory = "articles")
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

