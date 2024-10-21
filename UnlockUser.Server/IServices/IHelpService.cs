using Newtonsoft.Json;
using System.Diagnostics;
using System.Text.RegularExpressions;

namespace UnlockUser.Server.IServices;

public class IHelpService(IHttpContextAccessor httpContext) : IHelp
{

    public string Message { get; set; } = "";
    private readonly IHttpContextAccessor _httpContext = httpContext;

    // Save history logfile
    public void SaveFile(List<string> contentList, string pathName, string fileName)
    {
        var path = $@"wwwroot\logfiles\{pathName}\";
        if (CheckDirectory(path))
        {
            try
            {
                contentList.Add("\n\n Datum: " + DateTime.Now.ToString("yyyy.MM.dd HH:mm:ss"));

                // Write the string array to a new file named ".txt".
                pathName = Path.Combine(path, $"{fileName.ToLower().Replace(" ", "_").Replace("__", "_")}_{ DateTime.Now:f}.txt");

                using StreamWriter outputFile = new(pathName, true);
                
                foreach (var contentLine in contentList)
                {
                    //outputFile.WriteLine(contentLine + Environment.NewLine);
                    outputFile.WriteLine(contentLine);
                }
                outputFile.Close();
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
                Message += "\r" + ex.Message;
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
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
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

    // Update configuration json
    public void UpdateConfigFile(string config, string? parameter, string? value, string? obj = null)
    {
        try
        {
            var configJsonFile = File.ReadAllText($"{config}.json");
            dynamic? configJson = Newtonsoft.Json.JsonConvert.DeserializeObject(configJsonFile);

            if (configJson != null)
            {
                if (obj != null)
                    configJson[obj][parameter] = value;
                else
                    configJson[parameter] = value;

                var configJsonToUpdate = Newtonsoft.Json.JsonConvert.SerializeObject(configJson);
                File.WriteAllText($"{config}.json", configJsonToUpdate);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
        }
    }

    #region Help
    public static List<T> GetJsonList<T>(string fileName) where T : class
    {
        using StreamReader reader = new($@"wwwroot/json/{fileName}.json");
        return JsonConvert.DeserializeObject<List<T>>(reader.ReadToEnd()) ?? [];
    }

    public static async Task SaveUpdateJsonFile<T>(List<T> list, string name) where T : class
    {
        await using FileStream stream = File.Create($@"wwwroot/json/{name}.json");
        await System.Text.Json.JsonSerializer.SerializeAsync(stream, list);
    }
    #endregion
}
