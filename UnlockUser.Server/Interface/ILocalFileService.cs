namespace UnlockUser.Server.Interface;

public interface ILocalFileService
{
    Task<List<T>> GetListFromEncryptedFile<T>(string fileName) where T : class;
    Task<string?> GetStringFromEncryptedFile(string fileName);
    byte[] EncryptStringToBytes(string plainText);
    string DecryptStringFromBytes(byte[] cypherText);
    Task SaveUpdateEncryptedModelFile<T>(List<T> list, string pathName, string fileName) where T : class;
    Task SaveUpdateEncryptedStringFile(string text, string pathName, string fileName);
    void UpdateConfigFile(string config, string? parameter, string? value, string? obj = null);
    List<T> GetJsonFile<T>(string fileName);
    Task SaveUpdateTextFile<T>(List<T> models, string fileName) where T : class;
    Task<List<T>> GetListFromTextFile<T>(string pathName) where T : class;
}
