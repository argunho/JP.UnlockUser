﻿using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace UnlockUser.Server.IServices;

public partial class IHelpService : IHelp
{

    public string Message { get; set; } = "";
    private readonly IHttpContextAccessor _httpContext;
    private static byte[] secureKeyInBytes = Encoding.UTF8.GetBytes("unlockuser_2024key_alvestakommun");
    private static byte[] secureKeyIV = Encoding.UTF8.GetBytes("unlock_user_2024");

    public IHelpService() { }

    public IHelpService(IHttpContextAccessor httpContext)
    {
        _httpContext = httpContext;
    }

    // Save history logfile
    public void SaveFile(List<string> contentList, string pathName)
    {
        var directory = $@"wwwroot\{pathName}";
        if (CheckDirectory(directory))
        {
            try
            {
                contentList.Add("\n\n Datum: " + DateTime.Now.ToString("yyyy.MM.dd HH:mm:ss"));

                // Write the string array to a new file named ".txt".
                var fileName = string.Concat(Guid.NewGuid().ToString().AsSpan(10), "_", DateTime.Now.ToString("yyyyMMddHHmmss"));
                var path = Path.Combine(directory, $"{fileName}.txt");

                //using StreamWriter outputFile = new(pathName, true);
                using StreamWriter stream = File.CreateText(path);
                foreach (var contentLine in contentList)
                    stream.WriteLine(contentLine);

                stream.Close();
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
                Message += "\r" + ex.Message;
            }
        }

    }

    // Check directory path exists or not
    public bool CheckDirectory(string path)
    {
        try
        {
            if (!Directory.Exists(path)) // Check directory          
                Directory.CreateDirectory(path); //Create directory if it doesn't exist
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return false;
        }

        return true;
    }

    // Check local host
    public bool CheckLocalHost()
    {
        string url = _httpContext.HttpContext.Request.Host.Value.ToString();
        var regex = Regex();
        return url.IndexOf("localhost") > -1 || url.IndexOf("[::1]") > -1 || regex.IsMatch(url);
    }

    // Return message if sommething went wrong.
    public JsonResult Response([FromBody] string msg, string alert = "warning")
    {
        // Activate a button in the user interface for sending an error message to the system developer if the same error is repeated more than two times during the same session
        return new JsonResult(new
        {
            alert,
            msg = alert == "warninig" ? msg : "Något har gått snett. Var vänlig försök igen.",
            errorMessage = alert == "error" ? msg : null
        });
    }

    #region Help
    public static List<T> GetListFromFile<T>(string fileName) where T : class
    {
        try
        {
            var path = Path.Combine(@"wwwroot/files/", $"{fileName}.txt");
            if(!File.Exists(path))
                return [];
            var res = File.ReadAllText(path);
            byte[] resInBytes = Convert.FromBase64String(res);

            // Decrypt file content
            string decryptDataInString = DecryptStringFromBytes(resInBytes);
            return JsonConvert.DeserializeObject<List<T>>(decryptDataInString) ?? [];
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return [];
        }
    }

    public static async Task<string?> SaveUpdateFile<T>(List<T> list, string fileName) where T : class
    {
        string? error = String.Empty;
        try
        {
            var directory = @"wwwroot/files/";
            var help = new IHelpService();
            help.CheckDirectory(directory);

            var path = Path.Combine(directory, $"{fileName}.txt");
            if (File.Exists(path))
                File.Delete(path);

            if(list.Count == 0)
                return null;

            await Task.Delay(1000);

            // Encrypt file
            var encryptedValue = JsonConvert.SerializeObject(list, Formatting.None);

            // Encrypt the string to an array of bytes.
            byte[] encrypted = EncryptStringToBytes(encryptedValue);
            string exryotedText = Convert.ToBase64String(encrypted);
            File.WriteAllText(path, exryotedText, Encoding.UTF8);

            //await using FileStream lockStream = new(path, FileMode.Open, FileAccess.ReadWrite, FileShare.None);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"{nameof(SaveUpdateFile)} => Error: ${ex.Message}");
            error = ex.Message;
        }

        return error;
    }

    public static List<T> GetJsonFile<T>(string fileName)
    {
        var path = Path.Combine(@"wwwroot/json/", $"{fileName}.json");
        using StreamReader reader = new(path);
        return JsonConvert.DeserializeObject<List<T>>(reader.ReadToEnd()) ?? [];


        // Save json file
        //await using FileStream stream = File.Create(path);
        //await System.Text.Json.JsonSerializer.SerializeAsync(stream, list);
        //stream.Close();
    }

    [GeneratedRegex(@"\\/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/")]
    private static partial Regex Regex();

    static byte[] EncryptStringToBytes(string plainText)
    {
        // Check arguments.
        if (plainText == null || plainText.Length <= 0)
            throw new ArgumentNullException("plainText");

        byte[] encrypted;

        // Create an Aes object
        // with the specified key and IV.
        using (Aes aesAlg = Aes.Create())
        {
            aesAlg.Key = secureKeyInBytes;
            aesAlg.IV = secureKeyIV;

            //aesAlg.IV = IV;

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

    static string DecryptStringFromBytes(byte[] cipherText)
    {
        // Check arguments.
        if (cipherText == null || cipherText.Length <= 0)
            throw new ArgumentNullException("cipherText");

        // Declare the string used to hold
        // the decrypted text.
        string plaintext = null;

        // Create an Aes object
        // with the specified key and IV.
        using (Aes aesAlg = Aes.Create())
        {
            aesAlg.Key = secureKeyInBytes;
            aesAlg.IV = secureKeyIV;

            //aesAlg.IV = IV;

            // Create a decryptor to perform the stream transform.
            ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);

            // Create the streams used for decryption.
            using MemoryStream msDecrypt = new(cipherText);
            using CryptoStream csDecrypt = new(msDecrypt, decryptor, CryptoStreamMode.Read);
            using StreamReader srDecrypt = new(csDecrypt);

            // Read the decrypted bytes from the decrypting stream
            // and place them in a string.
            plaintext = srDecrypt.ReadToEnd();
        }

        return plaintext;
    }

    // Update configuration json
    public static void UpdateConfigFile(string config, string? parameter, string? value, string? obj = null)
    {
        try
        {
            var configJsonFile = File.ReadAllText($"{config}.json");
            dynamic? configJson = JsonConvert.DeserializeObject(configJsonFile);

            if (configJson != null)
            {
                if (obj != null)
                    configJson[obj][parameter] = value;
                else
                    configJson[parameter] = value;

                var configJsonToUpdate = JsonConvert.SerializeObject(configJson);
                File.WriteAllText($"{config}.json", configJsonToUpdate);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
        }
    }
    #endregion
}
