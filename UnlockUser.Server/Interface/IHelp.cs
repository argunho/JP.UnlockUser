
using Microsoft.AspNetCore.Mvc;

namespace UnlockUser.Server.Interface;

public interface IHelp
{
    string Message { get; set; }
    void SaveFile(List<string> contentList, string pathName);
    bool CheckDirectory(string path);
    bool CheckLocalHost();
    JsonResult Response(string message, string alert = "warning");
}
