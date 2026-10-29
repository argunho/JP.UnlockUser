using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UnlockUser.Server.Controllers;

[Route("api/article")]
[Route("api/articles")]
[ApiController]
[Authorize]
public class ArticleController(IHelpService helpService, ICredentialsService credentialsService,
        ILocalFileService localFileService) : ControllerBase
{
    private readonly IHelpService _help = helpService;
    private readonly ICredentialsService _credentials = credentialsService;
    private readonly ILocalFileService _localFile = localFileService;

    private static readonly SemaphoreSlim _catalogLock = new(1, 1);
    private const string ArticleCatalog = "catalogs/articles";

    private List<string> GetPermissionGroups() =>
        _credentials.GetClaim("permissions")?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList() ?? [];

    private static bool IsVisibleToGroups(ArticleModel article, List<string> groups) =>
        article.Groups?.Any(group => groups.Contains(group, StringComparer.OrdinalIgnoreCase)) == true;

    #region GET
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            List<ArticleModel> articles = await _localFile.GetEncryptedFile<List<ArticleModel>>(ArticleCatalog);
            articles ??= [];
            List<string> groups = GetPermissionGroups();

            return Ok(articles.Where(article => IsVisibleToGroups(article, groups))
                .OrderBy(article => article.OrderById).ToList());
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, await _help.Error(ex));
        }
    }

    [HttpGet("popup/message")]
    public async Task<IActionResult> GetMessage()
    {
        try
        {
            List<ArticleModel> articles = await _localFile.GetEncryptedFile<List<ArticleModel>>(ArticleCatalog);
            articles ??= [];
            var claims = _credentials.GetClaims(["username"]);
            claims.TryGetValue("username", out var username);
            if (string.IsNullOrEmpty(username))
                return Ok();

            List<string> groups = GetPermissionGroups();
            var popup = articles.FirstOrDefault(article => article.Popup
                && !(article.Hidden ?? []).Contains(username, StringComparer.OrdinalIgnoreCase)
                && IsVisibleToGroups(article, groups));
            if (popup == null)
                return Ok();

            return Ok(new MessageViewModel
            {
                Name = popup.Name,
                Html = popup.Html
            });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, await _help.Error(ex));
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            List<ArticleModel> articles = await _localFile.GetEncryptedFile<List<ArticleModel>>(ArticleCatalog);
            articles ??= [];
            List<string> groups = GetPermissionGroups();
            var article = articles.FirstOrDefault(item => item.Id == id && IsVisibleToGroups(item, groups));
            return article == null ? NotFound() : Ok(article);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, await _help.Error(ex));
        }
    }
    #endregion

    #region POST
    // Save uploaded file docx
    [HttpPost]
    public async Task<IActionResult> Post(ArticleModel model)
    {
        if (!ModelState.IsValid)
            return Ok(_help.Warning());

        try
        {
            await _catalogLock.WaitAsync();
            try
            {
                List<ArticleModel> articles = await _localFile.GetEncryptedFile<List<ArticleModel>>(ArticleCatalog);
                articles ??= [];
                if (articles.Exists(article => string.Equals(article.Name, model.Name, StringComparison.OrdinalIgnoreCase)))
                    return Ok(_help.Warning("En artikel med liknande namn är redan registrerad."));

                model.OrderById = articles.Count + 1;
                articles.Add(model);

                await _localFile.EncrypteToFile(articles, ArticleCatalog);
                return Ok();
            }
            finally
            {
                _catalogLock.Release();
            }
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
            await _catalogLock.WaitAsync();
            try
            {
                List<ArticleModel> articles = await _localFile.GetEncryptedFile<List<ArticleModel>>(ArticleCatalog);
                articles ??= [];
                for (int i = 0; i < names.Count; i++)
                {
                    int order = i + 1;
                    string name = names[i];
                    foreach (var article in articles)
                    {
                        if (string.Equals(article.Name, name, StringComparison.OrdinalIgnoreCase))
                            article.OrderById = order;
                    }
                }

                await _localFile.EncrypteToFile(articles, ArticleCatalog);
                return Ok();
            }
            finally
            {
                _catalogLock.Release();
            }
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }

    [HttpPost("hide/popup/message")]
    public async Task<IActionResult> HideModalMessage()
    {
        string? username = _credentials.GetClaim("username");
        if (string.IsNullOrEmpty(username))
            return Ok();

        try
        {
            await _catalogLock.WaitAsync();
            try
            {
                List<ArticleModel> articles = await _localFile.GetEncryptedFile<List<ArticleModel>>(ArticleCatalog);
                articles ??= [];
                List<string> groups = GetPermissionGroups();
                var popup = articles.FirstOrDefault(article => article.Popup
                    && !(article.Hidden ?? []).Contains(username, StringComparer.OrdinalIgnoreCase)
                    && IsVisibleToGroups(article, groups));
                if (popup == null)
                    return Ok();

                popup.Hidden ??= [];
                if (!popup.Hidden.Contains(username, StringComparer.OrdinalIgnoreCase))
                    popup.Hidden.Add(username);

                await _localFile.EncrypteToFile(articles, ArticleCatalog);
                return Ok();
            }
            finally
            {
                _catalogLock.Release();
            }
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }
    #endregion

    #region PUT
    [HttpPut("{id}")]
    public async Task<IActionResult> Put(string id, ArticleModel model)
    {
        if (!ModelState.IsValid)
            return Ok(_help.Warning());

        try
        {
            await _catalogLock.WaitAsync();
            try
            {
                List<ArticleModel> articles = await _localFile.GetEncryptedFile<List<ArticleModel>>(ArticleCatalog);
                articles ??= [];
                if (articles.Exists(article => article.Id != id
                    && string.Equals(article.Name, model.Name, StringComparison.OrdinalIgnoreCase)))
                    return Ok(_help.Warning("En artikel med liknande namn är redan registrerad."));

                int articleIndex = articles.FindIndex(article => article.Id == id);
                if (articleIndex < 0)
                    return NotFound();

                model.Id = id;
                articles[articleIndex] = model;
                await _localFile.EncrypteToFile(articles, ArticleCatalog);
                return Ok();
            }
            finally
            {
                _catalogLock.Release();
            }
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
            await _catalogLock.WaitAsync();
            try
            {
                List<ArticleModel> articles = await _localFile.GetEncryptedFile<List<ArticleModel>>(ArticleCatalog);
                articles ??= [];
                if (articles.RemoveAll(article => article.Id == id) == 0)
                    return NotFound();

                await _localFile.EncrypteToFile(articles, ArticleCatalog);
                return Ok();
            }
            finally
            {
                _catalogLock.Release();
            }
        }
        catch (Exception ex)
        {
            return BadRequest(await _help.Error(ex));
        }
    }
    #endregion
}

