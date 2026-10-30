using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UnlockUser.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ManualController(IHelpService helpService, ILocalFileService localFileService) : ControllerBase
{
    private readonly IHelpService _help = helpService;
    private readonly ILocalFileService _localFile = localFileService;

    private static readonly SemaphoreSlim _catalogLock = new(1, 1);
    private const string ManualCatalog = "catalogs/manuals";

    #region GET
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            List<ManualModel>? manuals = await _localFile.GetEncryptedFile<List<ManualModel>>(ManualCatalog);
            return Ok(manuals?.OrderBy(manual => manual.OrderById).ToList());
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
            List<ManualModel>? manuals = await _localFile.GetEncryptedFile<List<ManualModel>>(ManualCatalog);
            var manual = manuals?.FirstOrDefault(item => item.Id == id);
            return manual == null ? NotFound() : Ok(manual);
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
    public async Task<IActionResult> Post(ManualModel model)
    {
        if (!ModelState.IsValid)
            return Ok(_help.Warning());

        try
        {
            await _catalogLock.WaitAsync();
            try
            {
                List<ManualModel>? manuals = await _localFile.GetEncryptedFile<List<ManualModel>>(ManualCatalog);
                manuals ??= [];
                if (manuals.Exists(manual => string.Equals(manual.Name, model.Name, StringComparison.OrdinalIgnoreCase)))
                    return Ok(_help.Warning("En manual med liknande namn är redan registrerad."));

                model.Id = Guid.NewGuid().ToString();
                model.OrderById = manuals.Count + 1;
                manuals.Add(model);

                await _localFile.EncrypteToFile(manuals, ManualCatalog);
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
                List<ManualModel>? manuals = await _localFile.GetEncryptedFile<List<ManualModel>>(ManualCatalog);
                manuals ??= [];
                for (int i = 0; i < names.Count; i++)
                {
                    int order = i + 1;
                    string name = names[i];
                    foreach (var manual in manuals)
                    {
                        if (string.Equals(manual.Name, name, StringComparison.OrdinalIgnoreCase))
                            manual.OrderById = order;
                    }
                }

                await _localFile.EncrypteToFile(manuals, ManualCatalog);
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
    public async Task<IActionResult> Put(string id, ManualModel model)
    {
        if (!ModelState.IsValid)
            return Ok(_help.Warning());

        try
        {
            await _catalogLock.WaitAsync();
            try
            {
                List<ManualModel>? manuals = await _localFile.GetEncryptedFile<List<ManualModel>>(ManualCatalog);
                manuals ??= [];
                if (manuals.Exists(manual => manual.Id != id
                    && string.Equals(manual.Name, model.Name, StringComparison.OrdinalIgnoreCase)))
                    return Ok(_help.Warning("En manual med liknande namn är redan registrerad."));

                int manualIndex = manuals.FindIndex(manual => manual.Id == id);
                if (manualIndex < 0)
                    return NotFound();

                model.Id = id;
                manuals[manualIndex] = model;
                await _localFile.EncrypteToFile(manuals, ManualCatalog);
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
                List<ManualModel>? manuals = await _localFile.GetEncryptedFile<List<ManualModel>>(ManualCatalog);
                manuals ??= [];
                if (manuals.RemoveAll(manual => manual.Id == id) == 0)
                    return NotFound();

                await _localFile.EncrypteToFile(manuals, ManualCatalog);
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