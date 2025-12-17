namespace UnlockUser.Server.Interface;

public interface ILocalFileService
{
    List<T> GetListFromFile<T>(string fileName) where T : class;
    byte[] EncryptStringToBytes(string plainText);
    string DecryptStringFromBytes(byte[] cypherText);
    Task<string?> SaveUpdateFile<T>(List<T> list, string fileName) where T : class;
    void UpdateConfigFile(string config, string? parameter, string? value, string? obj = null);
    List<T> GetJsonFile<T>(string fileName);
}
