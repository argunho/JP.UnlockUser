using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Diagnostics;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace UnlockUser.Server.IServices;

public partial class HelpService : IHelp
{
    public string Message { get; set; } = "";
    private static byte[] secureKeyInBytes = Encoding.UTF8.GetBytes("unlockuser_2024key_alvestakommun"); // Length 36 chars
    private static byte[] secureKeyIV = Encoding.UTF8.GetBytes("unlock_user_2024"); // Length 16 chars
    private readonly IHttpContextAccessor _httpContext;

    public HelpService()
    {
        _httpContext = new HttpContextAccessor();
    }

    // Save history logfile
    public void SaveLogFile(List<string> contentList, string pathName)
    {
        var directory = $@"wwwroot\logfiles\{pathName}";
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
        IHttpContextAccessor _httpContext = new HttpContextAccessor();
        string url = _httpContext.HttpContext.Request.Host.Value.ToString();
        var regex = Regex();
        return url.IndexOf("localhost") > -1 || url.IndexOf("[::1]") > -1 || regex.IsMatch(url);
    }

    // Return message if sommething went wrong.
    public JsonResult Response(string alert, [FromBody] string msg)
                => new(new { alert, msg});

    public JsonResult NotFound(string name)
    => new(new { color = "warning", msg = $"{name} med matchande Id eller Namn hittades inte." });

    public JsonResult Warning(string? message = null)
        => new(new { color = "warning", msg = message ?? "Felaktiga formulärdata. Kontrollera de ifyllda formuläruppgifterna." });

    public JsonResult Error(string position, string message, string pathname = "errors")
    {
        SaveLogFile([position, message], pathname);
        return new (new { color = "error", msg = $"Något har gått snett. Fel: {message}" });
    }

    public string? GetClaim(string name)
    {
        try
        {      
            ClaimsPrincipal user = _httpContext.HttpContext?.User ?? new();

            if (name == "roles")
                return string.Join(",", user.FindAll(ClaimTypes.Role).Select(s => s.Value));

            return user.Claims?.FirstOrDefault(x => x?.Type.ToLower() == name?.ToLower())?.Value;
        }
        catch (Exception)
        {
            return null;
        }
    }

    public Dictionary<string, string>? GetClaims(params string[] str)
    {
        try
        {
            var keysValues = new Dictionary<string, string>();
            ClaimsPrincipal user = _httpContext.HttpContext?.User ?? new();

            foreach (var claim in user.Claims.Where(x => str.Contains(x.Type.ToLower())))
            {
                keysValues.Add(claim.Type.ToString().ToLower(), claim.Value);
            }

            if (str.Contains("roles"))
            {
                keysValues["roles"] = string.Join(",", user.FindAll(ClaimTypes.Role).Select(s => s.Value));
                //keysValues.Add("roles",
                //    string.Join(",", _httpContext.HttpContext.User.FindAll(ClaimTypes.Role).Select(s => s.Value))
                //);
            }

            return keysValues;
        }
        catch (Exception)
        {
            return null;
        }
    }

    #region Help
    [GeneratedRegex(@"\\/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/")]
    private static partial Regex Regex();
    #endregion
}
