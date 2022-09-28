using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.DirectoryServices.AccountManagement;

namespace UnlockUser.Extensions;

[DirectoryRdnPrefix("CN")]
[DirectoryObjectClass("user")]
public class UserPrincipalExtension : UserPrincipal
{
    public UserPrincipalExtension(PrincipalContext context)
    : base(context) { }

    [DirectoryProperty("department")]
    public string Department
    {
        get
        {
            if (ExtensionGet("department").Length != 1)
                return string.Empty;

            return (string)ExtensionGet("department")[0];
        }

        set { ExtensionSet("department", value); }
    }

    [DirectoryProperty("title")]
    public string Title
    {
        get
        {
            if (ExtensionGet("title").Length != 1)
                return string.Empty;

            return (string)ExtensionGet("title")[0];
        }

        set { ExtensionSet("title", value); }
    }

    [DirectoryProperty("physicalDeliveryOfficeName")]
    public string Office
    {
        get
        {
            if (ExtensionGet("physicalDeliveryOfficeName").Length != 1)
                return string.Empty;

            return (string)ExtensionGet("physicalDeliveryOfficeName")[0];
        }

        set { ExtensionSet("physicalDeliveryOfficeName", value); }

    }

    public static new UserPrincipalExtension FindByIdentity(PrincipalContext context, string identityValue)
    {
        return (UserPrincipalExtension)FindByIdentityWithType(context, typeof(UserPrincipalExtension), identityValue);
    }
}