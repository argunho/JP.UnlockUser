using System.Security.Claims;
using System.Text.RegularExpressions;

namespace UnlockUser.Server.IServices;

public partial class HelpService(IHttpContextAccessor httpContext) : IHelp
{
    private readonly IHttpContextAccessor _httpContext = httpContext;

    // Check local host
    public bool CheckLocalHost()
    {
        string url = _httpContext.HttpContext!.Request.Host.Value!.ToString();
        var regex = Regex();
        return url.IndexOf("localhost") > -1 || url.IndexOf("[::1]") > -1 || regex.IsMatch(url);
    }



    #region Help
    [GeneratedRegex(@"\\/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/")]
    private static partial Regex Regex();
    #endregion
}
