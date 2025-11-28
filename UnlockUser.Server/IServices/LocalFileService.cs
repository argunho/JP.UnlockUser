using Newtonsoft.Json;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;

namespace UnlockUser.Server.IServices;

public class LocalFileService(IConfiguration config) : ILocalFileService
{
    private readonly IConfiguration _config = config;

    public List<T> GetListFromFile<T>(string fileName) where T : class
    {
        try
        {
            var path = Path.Combine(@"wwwroot/files/", $"{fileName}.txt");
            if (!File.Exists(path))
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


    #region Help methods
    private static (byte[], byte[]) GetKeys()
    {
        var secureKeyInBytes = Encoding.UTF8.GetBytes("unlockuser_2024key_alvestakommun"); // Length 36 chars
        var secureKeyIV = Encoding.UTF8.GetBytes("unlock_user_2024"); // Length 16 chars

        return (secureKeyInBytes, secureKeyIV);
    }
    #endregion
}
