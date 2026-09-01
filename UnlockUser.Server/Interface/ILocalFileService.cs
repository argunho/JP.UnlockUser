namespace UnlockUser.Server.Interface;

public interface ILocalFileService
{
    Task<T?> GetEncryptedFile<T>(string fileName);
    Task EncrypteToFile<T>(T? data, string pathName, string fileName);
    void UpdateConfigFile(string config, string? parameter, string? value, string? obj = null);
    List<T> GetJsonFile<T>(string fileName);
}
