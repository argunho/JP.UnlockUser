using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace UnlockUser.Server.Controllers;

[Route("[controller]")]
[ApiController]
public class AuthController(IActiveDirectory provider, IConfiguration config, IHttpContextAccessor contextAccessor) : ControllerBase
{
    private readonly IActiveDirectory _provider = provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly IConfiguration _config = config; // Implementation of configuration file => ActiveDerictory/appsettings.json
    private readonly IHttpContextAccessor _contextAccessor = contextAccessor;
    private readonly ISession _session = contextAccessor.HttpContext.Session;

    #region GET
    // Logout
    [HttpGet("logout")]
    public JsonResult Logout()
    {
        try
        {
            var _session = HttpContext.Session;
            _session.Remove("Username");
            _session.Remove("FullName");
            _session.Remove("Email");
            _session.Remove("Password");
            _session.Remove("GroupToManage");
            _session.Remove("PasswordResetGroup");
            _session.Remove("LoginAttempt");
            _session.Remove("LoginBlockTime");
        }
        catch (Exception ex)
        {
            return new JsonResult(new { errorMessage = ex.Message });
        }

        return new JsonResult(true);
    }
    #endregion

    #region POST
    // Log in with another account if authentication with windows username is failed or to authorize another user
    [HttpPost]
    public JsonResult Post(LoginViewModel model)
    {
        if (!ModelState.IsValid)// Forms filled out incorrectly
            return new JsonResult(new { alert = "warning", msg = "Felaktigt eller ofullständigt ifyllda formulär" });

        try
        {
            int loginAttempt = _session?.GetInt32("LoginAttempt") ?? 0;
            var response = ProtectAccount(loginAttempt);
            if (response != null) return response;

            // Validate username and password
            var isAutheticated = _provider.AccessValidation(model?.Username, model?.Password);

            //Incorrect username or password
            if (!isAutheticated)
            {
                // If the user tried to put in a wrong password, save this like +1 a wrong attempt and the max is 4 attempts
                _session?.SetInt32("LoginAttempt", loginAttempt += 1);

                return new JsonResult(new
                {
                    alert = "error",
                    loginAttempt,
                    msg = $"<b>Felaktig användarnamn eller lösenord.</b><br/> {4 - loginAttempt} försök kvar."
                });
            }

            _session?.Remove("LoginAttempt");
            _session?.Remove("LoginBlockTime");

            var permissionGroups = _config.GetSection("Groups").Get<List<GroupModel>>();
            var user = _provider.FindUserByExtensionProperty(model.Username);
            var userGroups = _provider.GetUserGroups(user);
            permissionGroups.RemoveAll(x => !userGroups.Contains(x.PermissionGroup));
            permissionGroups ??= [];
            List<string> roles = [];

            // Access if user are a manager
            bool manager = user.Title.ToLower().Contains("chef", StringComparison.CurrentCultureIgnoreCase)
                           || user.Title.ToLower().Contains("rektor", StringComparison.CurrentCultureIgnoreCase);

            if (_provider.MembershipCheck(user, "Azure-Utvecklare Test"))
                roles.Add("Developer");

            if (_provider.MembershipCheck(user, "TEIS IT avdelning") || roles.IndexOf("Developer") > -1)
                roles.Add("Support");

            if (manager)
                roles.Add("Manager");

            // Failed! Permission missed
            if (permissionGroups.Count == 0 && roles.Count == 0)
                return new JsonResult(new { alert = "warning", msg = "Åtkomst nekad! Behörighet saknas." });

            if (roles.IndexOf("Support") > -1)
                permissionGroups.Add(new GroupModel
                {
                    Name = "Support",
                    Manage = "Students, Employee"
                });
          
            var groups = permissionGroups.OrderBy(x => x.Name).Select(s => new GroupModel
            {
                Name = s.Name,
                Manage = s.Manage
            }).ToList();
            var groupsNames = string.Join(",", groups.Select(s => s.Name));


            // If the logged user is found, create Jwt Token to get all other information and to get access to other functions
            var token = CreateJwtToken(user, string.Join(",", roles), model?.Password ?? "", groupsNames);

            // Response message
            var responseMessage = $"Tillåtna behöregiheter för grupp(er):<br/> <b>&nbsp;&nbsp;&nbsp;- {groupsNames.Replace(",", "<br/>&nbsp;&nbsp;&nbsp; -")}</b>.";
            if (manager && groups.Count == 0)
                responseMessage = $"Du som {user.Title} har för närvarande inte behörighet att ändra lösenord.";

            var schools = IHelpService.GetJsonList<School>("schools");

            // Your access has been confirmed.
            return new JsonResult(new
            {
                alert = "success",
                token,
                groups,
                schools,
                msg = $"Din åtkomstbehörighet har bekräftats.<br/><br/> {responseMessage}"
            });
        }
        catch (Exception ex)
        {
            // Activate a button in the user interface for sending an error message to the system developer if the same error is repeated more than two times during the same session
            var repeated = _session?.GetInt32("RepeatedError") ?? 0;
            _session?.SetInt32("RepeatedError", repeated += 1);
            return new JsonResult(new
            {
                alert = "warning",
                msg = "Något har gått snett. Var vänlig försök igen.",
                repeatedError = repeated,
                errorMessage = ex.Message
            });
        }
    }
    #endregion

    #region Helpers
    // Create Jwt Token for authenticating
    private string? CreateJwtToken(UserPrincipalExtension user, params string[] str)
    {
        if (user == null)
            return null;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);
        IdentityOptions opt = new();

        _session.SetString("Password", str[1]);

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.Name),
            new("Email", user.EmailAddress),
            new("DisplayName", user.DisplayName),
            new("Username", user.Name),
            new("Manager", user.Manager),
            new("Office", user.Office),
            new("Division", user.Division),
            new("Groups", str?[2] ?? ""),
            new("Roles", str?[0] ?? "")
        };

        foreach (var role in str[0]?.Split(","))
            claims.Add(new Claim(opt.ClaimsIdentity.RoleClaimType, role));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims.ToArray()),
            Expires = DateTime.Now.AddDays(3),
            SigningCredentials = credentials
        };

        var encodeToken = new JwtSecurityTokenHandler();
        var securityToken = encodeToken.CreateToken(tokenDescriptor);
        var token = encodeToken.WriteToken(securityToken);

        return token;
    }

    // Protection against account blocking after several unsuccessful attempts to authenticate
    public JsonResult? ProtectAccount(int attempt)
    {
        var blockTime = _session?.GetString("LoginBlockTime") ?? null;
        if (attempt >= 4)
        {
            blockTime = DateTime.Now.ToString();
            _session?.SetString("LoginBlockTime", blockTime);
            _session?.SetInt32("LoginAttempt", 0);
        }

        // Check if the user is blocked from further attempts to enter incorrect data
        // Unclock time after 4 incorrect passwords

        if (blockTime == null)
            return null;

        DateTime blockTimeStamp = Convert.ToDateTime(blockTime);
        var timeLeftTicks = DateTime.Now.Ticks - blockTimeStamp.AddMinutes(30).Ticks;

        if (timeLeftTicks > 0) return null;

        var timeLeft = new DateTime(Math.Abs(timeLeftTicks));

        return new JsonResult(new
        {
            alert = "warning",
            msg = $"Vänta {timeLeft:HH:mm:ss} minuter innan du försöker igen.",
            timeLeft = timeLeft.ToString("HH:mm:ss"),
            blockTime = blockTimeStamp
        });
    }
    #endregion
}