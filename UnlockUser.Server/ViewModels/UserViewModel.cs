using System.ComponentModel.DataAnnotations;

namespace UnlockUser.Server.ViewModels;

public class UserViewModel
{
    public string? Username { get; set; }

    [DataType(DataType.Password)]
    public string? Password { get; set; }

    public  string? GroupName { get; set; }

    public UserCredentials? Credentials { get; set; }
}

public class UserCredentials {
    public string? Username { get; set; }
    public string? Password { get; set; }
}

public class UsersListViewModel
{
    public List<UserViewModel> Users { get; set; } = [];
}