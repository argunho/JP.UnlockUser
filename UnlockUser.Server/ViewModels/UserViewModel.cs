using System.ComponentModel.DataAnnotations;

namespace UnlockUser.Server.ViewModels;

public class UserViewModel
{
    public string? Name { set; get; }
    public string? Username { get; set; }

    [DataType(DataType.Password)]
    public string? Password { get; set; }

    public  string? GroupName { get; set; }

    public UserCredentialsViewModel? Credentials { get; set; }
}

