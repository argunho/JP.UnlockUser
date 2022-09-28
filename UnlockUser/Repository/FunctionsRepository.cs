using System.Diagnostics;
using System.Text.RegularExpressions;
using UnlockUser.Extensions;
using UnlockUser.Interface;
using UnlockUser.Models;

namespace UnlockUser.Repository;

public class FunctionsRepository : IFunctions
{

    public string Message { get; set; }
    private readonly IHttpContextAccessor _httpContext;

    public FunctionsRepository(IHttpContextAccessor httpContext)
    {
        _httpContext = httpContext;
    }

    // Save history logfile
    public void SaveHistoryLogFile(List<string> contentList, string fileName, string format)
    {
        var path = @"wwwroot\logfiles";

        if (CheckDirectory(path))
        {
            try
            {
                contentList.Add("\n\n Datum: " + DateTime.Now.ToString("yyyy.MM.dd HH:mm:ss"));

                // Write the string array to a new file named ".txt".
                string pathName = Path.Combine(path, fileName.ToLower().Replace(" ", "_").Replace("__", "_") + format);

                using StreamWriter outputFile = new(pathName, true);

                foreach (var contentLine in contentList)
                {
                    //outputFile.WriteLine(contentLine + Environment.NewLine);
                    outputFile.WriteLine(contentLine);
                }
                outputFile.Close();
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                Message += "\r" + e.Message;
            }
        }

    }

    // Check directory path exists or not
    public bool CheckDirectory(string path)
    {
        try
        {
            if (!Directory.Exists(path)) // Check directory          
                Directory.CreateDirectory(path); //Create directory if it doesn't exist
        }
        catch (Exception e)
        {
            Debug.WriteLine(e.Message);
            return false;
        }

        return true;
    }

    // Check local host
    public bool CheckLocalHost()
    {
        string url = _httpContext.HttpContext.Request.Host.Value.ToString();
        var regex = new Regex(@"\\/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/");
        return url.IndexOf("localhost") > -1 || url.IndexOf("[::1]") > -1 || regex.IsMatch(url);
    }
}
