using System.Security.Claims;
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

    // Check local host
    public bool CheckLocalHost()
    {
        IHttpContextAccessor _httpContext = new HttpContextAccessor();
        string url = _httpContext.HttpContext.Request.Host.Value.ToString();
        var regex = Regex();
        return url.IndexOf("localhost") > -1 || url.IndexOf("[::1]") > -1 || regex.IsMatch(url);
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
