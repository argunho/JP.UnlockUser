
using Microsoft.AspNetCore.Mvc;

namespace UnlockUser.Server.Interface;

public interface IHelp
{
    string Message { get; set; }
    void SaveLogFile(List<string> contentList, string pathName);
    bool CheckDirectory(string path);
    bool CheckLocalHost();
    JsonResult Response(string alert, string message);
    JsonResult NotFound(string name);
    JsonResult Warning(string? message = null);
    JsonResult Error(string position, string message, string pathname = "errors");
    string? GetClaim(string name);
    Dictionary<string, string>? GetClaims(params string[] str);
}
