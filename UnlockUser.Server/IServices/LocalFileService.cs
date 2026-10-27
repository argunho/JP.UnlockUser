using Google.Apis.Admin.Directory.directory_v1.Data;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using System.Diagnostics.Eventing.Reader;
using System.Security.Cryptography;
using System.Text;

namespace UnlockUser.Server.IServices;

public class LocalFileService(IConfiguration config, IWebHostEnvironment env, IMemoryCache cache, ILogger<LocalFileService> logger) : ILocalFileService
{
    private readonly IConfiguration _config = config;
    private readonly ILogger<LocalFileService> _logger = logger;
    private readonly IWebHostEnvironment _env = env;
    private readonly IMemoryCache _cache = cache;
    private readonly string _webRootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
    private readonly string _contentRootPath = env.ContentRootPath;
    // start: 2026-10-16 11:02
    // Root folder for encrypted data files (catalogs, services). Configured via "LocalFiles:DataPath"
    // so the data can live outside the deployed site folder; falls back to wwwroot when not set.
    private readonly string _dataRootPath = string.IsNullOrWhiteSpace(config["LocalFiles:DataPath"])
        ? env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot")
        : Path.Combine(env.ContentRootPath, config["LocalFiles:DataPath"]!); // 2026-10-16 11:20 relative path resolves from content root, absolute stays as is
    // end


    public async Task<T?> GetEncryptedFile<T>(string fileName)
    {
        var path = Path.Combine(_dataRootPath, $"{fileName}.txt"); // 2026-10-16 11:02

        // If the file doesn't exist, do not create a cache entry — just return default
        if (!File.Exists(path))
        {
            _logger.LogDebug("GetEncryptedFile: file not found {fileName}", fileName);
            return default;
        }

        var cacheKey = $"json:{fileName}";
        var json = await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromMinutes(30); // Cache for 30 minutes, removes after this time if it is not used
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1); // Cache for 1 day, removes after this time even if it is used

            var res = await File.ReadAllTextAsync(path);
            byte[] resInBytes = Convert.FromBase64String(res);

            // Decrypt file content
            return DecryptStringFromBytes(resInBytes);
        });

        if (string.IsNullOrEmpty(json))
        {
            _logger.LogDebug("GetEncryptedFile: no data for {fileName}", fileName);
            return default;
        }

        return JsonConvert.DeserializeObject<T>(json);
    }

    public async Task EncrypteToFile<T>(T? data, string fileName)
    {
        try
        {
            if (data == null)
                return;

            string path = PathnameReadOnlyOwerwrite(fileName);

            await Task.Delay(1000);

            _logger.LogTrace("Starting process to save file {fileName}", fileName);

            // Encrypt file
            var encryptedValue = JsonConvert.SerializeObject(data, Formatting.None);

            SaveEncryptedData(path, encryptedValue);
            _cache.Remove($"json:{fileName}");

            _logger.LogTrace("End save process. {fileName}", fileName);

            //await using FileStream lockStream = new(path, FileMode.Open, FileAccess.ReadWrite, FileShare.None);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "{method} failed for {fileName}. Ensure the application identity has Modify permission on the data directory.", nameof(EncrypteToFile), fileName);
            throw;
        }
    }

    // Update configuration json
    public void UpdateConfigFile(string config, string? parameter, string? value, string? obj = null)
    {
        try
        {
            var configPath = Path.Combine(_contentRootPath, $"{config}.json");
            var configJsonFile = File.ReadAllText(configPath);
            dynamic? configJson = JsonConvert.DeserializeObject(configJsonFile);

            if (configJson != null)
            {
                if (obj != null)
                    configJson[obj][parameter] = value;
                else
                    configJson[parameter] = value;

                var configJsonToUpdate = JsonConvert.SerializeObject(configJson);
                try
                {
                    if (File.Exists(configPath))
                        File.SetAttributes(configPath, FileAttributes.Normal);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Could not clear attributes for config file {path}: {msg}", configPath, ex.Message);
                }

                File.WriteAllText(configPath, configJsonToUpdate);
                try
                {
                    File.SetAttributes(configPath, FileAttributes.Normal);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Could not set attributes for config file {path}: {msg}", configPath, ex.Message);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
        }
    }

    public List<T> GetJsonFile<T>(string fileName)
    {
        var path = Path.Combine(_webRootPath, "json", $"{fileName}.json");
        using StreamReader reader = new(path);
        return JsonConvert.DeserializeObject<List<T>>(reader.ReadToEnd()) ?? [];
    }

    public async Task<T?> ModeratorsView<T>(string? username = null, string? keyword = null)
    {
        var moderators = await GetEncryptedFile<List<UserViewModel>>("catalogs/moderators") ?? [];
        if (string.IsNullOrWhiteSpace(username))
        {
            if (typeof(T) == typeof(List<UserViewModel>))
                return (T)(object)moderators;

            throw new NotSupportedException($"Returning all moderators as {typeof(T).Name} is not supported.");
        }

        var moderator = moderators.FirstOrDefault(x => string.Equals(x.Username, username, StringComparison.OrdinalIgnoreCase));
        object? result;

        if (typeof(T) == typeof(UserViewModel))
        {
            result = moderator; 
        }
        else if (typeof(T) == typeof(PermissionsModel))
        {
            result = moderator?.Permissions;
        }
        else if (typeof(T) == typeof(List<string>))
        {
            if (string.IsNullOrWhiteSpace(keyword))
                throw new ArgumentException("A permission name is required when requesting a permission list.", nameof(keyword));

            var permissions = moderator?.Permissions;
            if (permissions is null)
                return default;

            result = keyword.ToLowerInvariant() switch
            {
                "groups" => permissions.Groups,
                "managers" => permissions.Managers,
                "politicians" => permissions.Politicians,
                "schools" => permissions.Schools,
                "employees" => permissions.Employees,
                "offices" => permissions.Offices,
                _ => throw new ArgumentException($"Unknown permission list '{keyword}'.", nameof(keyword))
            };
        }
        else
        {
            throw new NotSupportedException($"Returning moderator data as {typeof(T).Name} is not supported.");
        }

        return result is null ? default : (T)result;
    }

    #region Help methods
    private static (byte[], byte[]) GetKeys()
    {
        var secureKeyInBytes = Encoding.UTF8.GetBytes("unlockuser_2024key_alvestakommun"); // Length 36 chars
        var secureKeyIV = Encoding.UTF8.GetBytes("unlock_user_2024"); // Length 16 chars

        return (secureKeyInBytes, secureKeyIV);
    }

    private byte[] EncryptStringToBytes(string plainText)
    {        // Check arguments.
        if (plainText == null || plainText.Length <= 0)
            throw new ArgumentNullException("plainText");

        byte[] encrypted;
        var (secureKeyInBytes, secureKeyIV) = GetKeys();

        // Create an Aes object
        // with the specified key and IV.
        using (Aes aesAlg = Aes.Create())
        {
            aesAlg.Key = secureKeyInBytes;
            aesAlg.IV = secureKeyIV;

            // Create an encryptor to perform the stream transform.
            ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);

            // Create the streams used for encryption.
            using MemoryStream msEncrypt = new();
            using (CryptoStream csEncrypt = new(msEncrypt, encryptor, CryptoStreamMode.Write))
            {
                using StreamWriter swEncrypt = new(csEncrypt);
                //Write all data to the stream.
                swEncrypt.Write(plainText);
            }

            encrypted = msEncrypt.ToArray();
        }

        // Return the encrypted bytes from the memory stream.
        return encrypted;
    }

    private string DecryptStringFromBytes(byte[] cypherText)
    {
        // Check arguments.
        if (cypherText == null || cypherText.Length <= 0)
            throw new ArgumentNullException("cypherText");

        // Declare the string used to hold the decrypted text.
        string? plainText = null;
        var (secureKeyInBytes, secureKeyIV) = GetKeys();

        // Create an Aes object with the specified key and IV.
        using (Aes aesAlg = Aes.Create())
        {
            aesAlg.Key = secureKeyInBytes;
            aesAlg.IV = secureKeyIV;

            // Create a decryptor to perform the stream transform.
            ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);

            // Create the streams used for decryption.
            using MemoryStream msDecrypt = new(cypherText);
            using CryptoStream csDecrypt = new(msDecrypt, decryptor, CryptoStreamMode.Read);
            using StreamReader srDecrypt = new(csDecrypt);

            // Read the decrypted bytes from the decrypting stream  and place them in a string.
            plainText = srDecrypt.ReadToEnd();
        }

        return plainText;
    }

    private string PathnameReadOnlyOwerwrite(string pathname)
    {
        var fileName = Path.GetFileName($"{pathname}.txt");
        var directory = Path.Combine(_dataRootPath, pathname[..pathname.IndexOf('/')]); // 2026-10-16 11:02
        Directory.CreateDirectory(directory);

        var path = Path.Combine(directory, fileName);
        if (File.Exists(path))
        {
            try
            {
                // Clear the read-only attribute before replacing the file.
                File.SetAttributes(path, FileAttributes.Normal);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Could not clear file attributes for {path}: {msg}", path, ex.Message);
            }

            //try
            //{
            //    File.Delete(path);
            //}
            //catch (Exception ex)
            //{
            //    _logger.LogWarning("Could not delete existing file {path}: {msg}", path, ex.Message);
            //}
        }

        return path;
    }
    
    private void SaveEncryptedData(string path, string data)
    {
        // Encrypt the string to an array of bytes.
        byte[] encrypted = EncryptStringToBytes(data);
        string encryptedText = Convert.ToBase64String(encrypted);

        var directory = Path.GetDirectoryName(path) ?? _dataRootPath; // 2026-10-16 11:02
        var fileNameOnly = Path.GetFileName(path);
        var tempPath = Path.Combine(directory, $"{fileNameOnly}.{Guid.NewGuid():N}.tmp");

        try
        {
            Directory.CreateDirectory(directory);

            // Keep the current file intact until the encrypted temporary file is ready to replace it.
            File.WriteAllText(tempPath, encryptedText, Encoding.UTF8);

            // Move temp to target, overwrite if exists
            // File.Move has an overload with overwrite in recent .NET versions
            File.Move(tempPath, path, overwrite: true);

            try
            {
                // Ensure file is not left read-only
                File.SetAttributes(path, FileAttributes.Normal);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Could not set file attributes for {path}: {msg}", path, ex.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save encrypted data to {path}", path);
            // Clean up temp file if it still exists
            try
            {
                if (File.Exists(tempPath))
                    File.Delete(tempPath);
            }
            catch (Exception cleanupException)
            {
                _logger.LogWarning(cleanupException, "Could not remove temporary file {tempPath}", tempPath);
            }

            throw;
        }
    }
    #endregion
}
