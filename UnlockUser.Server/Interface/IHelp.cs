namespace UnlockUser.Server.Interface;

public interface IHelp
{
    string Message { get; set; }
    void SaveHistoryLogFile(List<string> contentList, string fileName, string format);
    bool CheckDirectory(string path);
    bool CheckLocalHost();
    void UpdateConfigFile(string config, string? parameter, string? value, string? obj = null);
}
