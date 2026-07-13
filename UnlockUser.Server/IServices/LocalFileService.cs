using Newtonsoft.Json;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;

namespace UnlockUser.Server.IServices;

public class LocalFileService(IConfiguration config, IWebHostEnvironment env, ILogger<LocalFileService> logger) : ILocalFileService
{
    private readonly IConfiguration _config = config;
    private readonly ILogger<LocalFileService> _logger = logger;
    private readonly string _webRootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
    private readonly string _contentRootPath = env.ContentRootPath;

    public async Task<List<T>> GetListFromEncryptedFile<T>(string fileName) where T : class
    {
        try
        {
            var path = Path.Combine(_webRootPath, $"{fileName}.txt");
            if (!File.Exists(path))
                return [];
            var res = await File.ReadAllTextAsync(path);
            byte[] resInBytes = Convert.FromBase64String(res);

            // Decrypt file content
            string decryptDataInString = DecryptStringFromBytes(resInBytes);
            return JsonConvert.DeserializeObject<List<T>>(decryptDataInString) ?? [];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
            return [];
        }
    }

    public string DecryptStringFromBytes(byte[] cypherText)
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

    public byte[] EncryptStringToBytes(string plainText)
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

    public async Task<string?> SaveUpdateEncryptedFile<T>(List<T> list, string pathName, string fileName) where T : class
    {
        string? error = String.Empty;
        try
        {
            var directory = Path.Combine(_webRootPath, pathName);
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

            if (list.Count == 0)
                return null;

            await Task.Delay(1000);

            _logger.LogInformation("Starting process to save file {fileName}", fileName);

            // Encrypt file
            var encryptedValue = JsonConvert.SerializeObject(list, Formatting.None);

            // Encrypt the string to an array of bytes.
            byte[] encrypted = EncryptStringToBytes(encryptedValue);
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


            _logger.LogInformation("End save process. {fileName}", fileName);

            //await using FileStream lockStream = new(path, FileMode.Open, FileAccess.ReadWrite, FileShare.None);
        }
        catch (Exception ex)
        {
            _logger.LogError($"{nameof(SaveUpdateEncryptedFile)} => Error: ${ex.Message}");
            error = ex.Message;
        }

        return error;
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

    // Save history logfile
    public async Task SaveUpdateTextFile<T>(List<T> models, string fileName) where T : class
    {
        var directory = Path.Combine(_webRootPath, "logs");
        if (CheckDirectory(directory))
        {
            var path = Path.Combine(directory, $"{fileName}.txt");
            if (File.Exists(path))
                File.Delete(path);

            if (models.Count > 0)
            {
                var json = System.Text.Json.JsonSerializer.Serialize(models);
                await File.WriteAllTextAsync(path, json, Encoding.UTF8);
            }

            //fileNem += string.Concat(Guid.NewGuid().ToString().AsSpan(10), "_", DateTime.Now.ToString("yyyyMMddHHmmss"));

            //// Write line by lien in file using loop of list
            //using StreamWriter stream = File.CreateText(path);
            //foreach (var contentLine in list)
            //    stream.WriteLine(contentLine);

            //stream.Close();
        }
    }

    // Read text fiel
    public async Task<List<T>> GetListFromTextFile<T>(string pathName) where T : class
    {
        string path = Path.Combine(_webRootPath, $"{pathName}.txt");
        string stringContent = await File.ReadAllTextAsync(path);
        return System.Text.Json.JsonSerializer.Deserialize<List<T>>(stringContent) ?? [];
    }

    #region Help methods
    private static (byte[], byte[]) GetKeys()
    {
        var secureKeyInBytes = Encoding.UTF8.GetBytes("unlockuser_2024key_alvestakommun"); // Length 36 chars
        var secureKeyIV = Encoding.UTF8.GetBytes("unlock_user_2024"); // Length 16 chars

        return (secureKeyInBytes, secureKeyIV);
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
    #endregion
}
