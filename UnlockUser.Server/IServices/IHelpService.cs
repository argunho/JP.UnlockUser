using Newtonsoft.Json;
using System.Diagnostics;
using System.Text.RegularExpressions;

namespace UnlockUser.Server.IServices;

public partial class IHelpService(IHttpContextAccessor httpContext) : IHelp
{

    public string Message { get; set; } = "";
    private readonly IHttpContextAccessor _httpContext = httpContext;

    // Save history logfile
    public void SaveFile(List<string> contentList, string pathName)
    {
        var directory = $@"wwwroot\{pathName}";
        if (CheckDirectory(directory))
        {
            try
            {
                contentList.Add("\n\n Datum: " + DateTime.Now.ToString("yyyy.MM.dd HH:mm:ss"));

                // Write the string array to a new file named ".txt".
                var fileName = string.Concat(Guid.NewGuid().ToString().AsSpan(10), "_", DateTime.Now.ToString("yyyyMMddHHmmss"));
                var path = Path.Combine(directory, $"{fileName}.txt");

                //using StreamWriter outputFile = new(pathName, true);
                using StreamWriter stream = File.CreateText(path);
                foreach (var contentLine in contentList)
                    stream.WriteLine(contentLine);

                stream.Close();
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
        var regex = Regex();
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
        try
        {
            using StreamReader reader = new($@"wwwroot/json/{fileName}.json");
            return JsonConvert.DeserializeObject<List<T>>(reader.ReadToEnd()) ?? [];
        }
        catch (Exception) { }

        return [];
    }

    public static async Task SaveUpdateJsonFile<T>(List<T> list, string name) where T : class
    {
        try
        {
            await using FileStream stream = File.Create($@"wwwroot/json/{name}.json");
            await System.Text.Json.JsonSerializer.SerializeAsync(stream, list);
        }catch(Exception ex)
        {
            Debug.WriteLine($"{nameof(SaveUpdateJsonFile)} => Error: ${ex.Message}");
        }
    }

    [GeneratedRegex(@"\\/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/")]
    private static partial Regex Regex();
    #endregion
}
