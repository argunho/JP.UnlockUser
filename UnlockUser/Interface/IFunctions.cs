using UnlockUser.Extensions;
using UnlockUser.Models;

namespace UnlockUser.Interface;

public interface IFunctions
{
    string Message { get; set; }
    void SaveHistoryLogFile(List<string> contentList, string fileName, string format);
    bool CheckDirectory(string path);
    bool CheckLocalHost();
}
