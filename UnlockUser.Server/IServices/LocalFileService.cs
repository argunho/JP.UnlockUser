using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
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


    public async Task<T?> GetEncryptedFile<T>(string fileName)
    {
        //var cacheKey = $"{fileName}:{typeof(T).FullName}";

        var json = await _cache.GetOrCreateAsync($"json:{fileName}", async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromMinutes(30); // Cache for 30 minutes, removes after this time if it is not used
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1); // Cache for 1 day, removes after this time even if it is used

            var path = Path.Combine(_webRootPath, $"{fileName}.txt");
            if (!File.Exists(path))
                return default;
            var res = await File.ReadAllTextAsync(path);
            byte[] resInBytes = Convert.FromBase64String(res);

            // Decrypt file content
            return DecryptStringFromBytes(resInBytes);
        });

        return JsonConvert.DeserializeObject<T>(json);
    }

    public async Task EncrypteToFile<T>(T? data, string pathname, string fileName)
    {
        string? error = String.Empty;
        try
        {
            if (data == null)
                return;

            if (_cache.TryGetValue($"{pathname}/{fileName}", out _))
                _cache.Remove(fileName);

            string path = PathnameReadOnlyOwerwrite(pathname, fileName);

            await Task.Delay(1000);

            _logger.LogInformation("Starting process to save file {fileName}", fileName);

            // Encrypt file
            var encryptedValue = JsonConvert.SerializeObject(data, Formatting.None);

            SaveEncryptedData(path, encryptedValue);

            _logger.LogInformation("End save process. {fileName}", fileName);

            //await using FileStream lockStream = new(path, FileMode.Open, FileAccess.ReadWrite, FileShare.None);
        }
        catch (Exception ex)
        {
            _logger.LogError($"{nameof(EncrypteToFile)} => Error: ${ex.Message}");
            throw new Exception();
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


        // Save json file
        //await using FileStream stream = File.Create(path);
        //await System.Text.Json.JsonSerializer.SerializeAsync(stream, list);
        //stream.Close();
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

    // Check directory path exists or not
    private bool CheckDirectory(string path)
    {
        try
        {
            if (!Directory.Exists(path)) // Check directory          
                Directory.CreateDirectory(path); //Create directory if it doesn't exist
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
            return false;
        }
    }

    private string PathnameReadOnlyOwerwrite(string pathname, string fileName)
    {
        var directory = Path.Combine(_webRootPath, pathname);
        CheckDirectory(directory);

        var path = Path.Combine(directory, $"{fileName}.txt");
        if (File.Exists(path))
        {
            try
            {
                // Remove read-only attribute if present so we can overwrite/delete
                File.SetAttributes(path, FileAttributes.Normal);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Could not clear file attributes for {path}: {msg}", path, ex.Message);
            }

            try
            {
                File.Delete(path);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Could not delete existing file {path}: {msg}", path, ex.Message);
            }
        }

        return path;
    }

    private void SaveEncryptedData(string path, string data)
    {
        // Encrypt the string to an array of bytes.
        byte[] encrypted = EncryptStringToBytes(data);
        string exryotedText = Convert.ToBase64String(encrypted);
        File.WriteAllText(path, exryotedText, Encoding.UTF8);
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
    #endregion
}
