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
            if (!isAutheticated)
            {
                // If the user tried to put in a wrong password, save this like +1 a wrong attempt and the max is 4 attempts
                _session?.SetInt32("LoginAttempt", loginAttempt += 1);

                return new JsonResult(new
                {
                    alert = "error",
                    loginAttempt,
                    msg = $"<b>Felaktig användarnamn eller lösenord.</b><br/> {4 - loginAttempt} försök kvar."
                }); //Incorrect username or password
            }

            _session?.Remove("LoginAttempt");
            _session?.Remove("LoginBlockTime");

            var permissionGroups = _config.GetSection("Groups").Get<List<GroupModel>>();
            var user = _provider.FindUserByExtensionProperty(model.Username);
            var userGroups = _provider.GetUserGroups(user);
            permissionGroups.RemoveAll(x => !userGroups.Contains(x.Group));
            if (permissionGroups == null)
                permissionGroups = [];

            // Acces if user are a manager
            bool manager = false;
            if (permissionGroups.Count == 0 || permissionGroups.FindIndex(x => x.Name?.ToLower() == "personal") == -1)
            {
                manager = user.Title.ToLower().Contains("chef") || user.Title.ToLower().Contains("rektor");
                var groupsList = _config.GetSection("Groups").Get<List<GroupModel>>();
                if (manager)
                    permissionGroups.Add(groupsList.Find(x => x.Name.ToLower() == "personal"));
            }

            // Failed! Permission missed
            if (permissionGroups.Count == 0)
                return new JsonResult(new { alert = "warning", msg = "Åtkomst nekad! Behörighet saknas." });

            var groups = permissionGroups.OrderBy(x => x.Name).Select(s => new GroupModel
            {
               Name = s.Name,
               Manage = s.Manage
            }).ToList();
            var groupsNames =  string.Join(",", groups.Select(s => s.Name));


            var roles = new List<string>() { "Employee" };
            if (_provider.MembershipCheck(user, "TEIS IT avdelning"))
                roles.Add("Support");
            //claims.Add(new Claim("Support", "Ok"));

            if (_provider.MembershipCheck(user, "Azure-Utvecklare Test"))
                roles.Add("Developer");

            if (user.Title.ToLower().Contains("chef") || user.Title.ToLower().Contains("rektor"))
                roles.Add("Manager");

            // If the logged user is found, create Jwt Token to get all other information and to get access to other functions
            var token = CreateJwtToken(user, roles, model?.Password ?? "", groupsNames);

            // Response message
            var responseMessage = $"Tillåtna behöregiheter för grupp(er):<br/> <b>&nbsp;&nbsp;&nbsp;- {groupsNames.Replace(",", "<br/>&nbsp;&nbsp;&nbsp; -")}</b>.";
            if (manager && groups.Count == 0)
                responseMessage = $"Du som {user.Title} har för närvarande inte behörighet att ändra lösenord.";

            // Your access has been confirmed.
            return new JsonResult(new
            {
                alert = "success",
                token,
                groups,
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
    private string? CreateJwtToken(UserPrincipalExtension user, List<string> roles, string password, string groups)
    {
        if (user == null)
            return null;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);
        IdentityOptions opt = new();

        _session.SetString("Password", password);

        List<GroupUsersViewModel> groupEmployees = [];
        try
        {
            using StreamReader reader = new(@"wwwroot/json/employees.json");
            var employeesJson = reader.ReadToEnd();
            groupEmployees = JsonConvert.DeserializeObject<List<GroupUsersViewModel>>(employeesJson);
        }
        catch (Exception) { }

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.Name),
            new("Email", user.EmailAddress),
            new("DisplayName", user.DisplayName),
            new("Username", user.Name),
            new("Manager", user.Manager),
            new("Office", user.Office),
            new("Division", user.Division),
            new("Groups", groups),
            new("Roles", string.Join(",", roles))
        };

        foreach (var role in roles)
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