namespace UnlockUser.Server.Interface;

public interface IHelp
{
    string Message { get; set; }
    void SaveFile(List<string> contentList, string pathName, string fileName);
    bool CheckDirectory(string path);
    bool CheckLocalHost();
    void UpdateConfigFile(string config, string? parameter, string? value, string? obj = null);
}
