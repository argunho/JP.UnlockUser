namespace UnlockUser.Server.Interface;

public interface ILocalFileService
{
    Task<List<T>> GetListFromEncryptedFile<T>(string fileName) where T : class;
    byte[] EncryptStringToBytes(string plainText);
    string DecryptStringFromBytes(byte[] cypherText);
    Task<string?> SaveUpdateEncryptedFile<T>(List<T> list, string fileName) where T : class;
    void UpdateConfigFile(string config, string? parameter, string? value, string? obj = null);
    List<T> GetJsonFile<T>(string fileName);
    Task SaveUpdateTextFile<T>(List<T> models, string fileName) where T : class;
    Task<List<T>> GetListFromTextFile<T>(string pathName) where T : class;
}
