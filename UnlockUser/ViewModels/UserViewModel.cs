using System.ComponentModel.DataAnnotations;

namespace UnlockUser.ViewModels;

public class UserViewModel
{
    public string? Username { get; set; }

    [DataType(DataType.Password)]
    public string? Password { get; set; }

    [DataType(DataType.Password)]
    public string? ConfirmPassword { get; set; }
    public UserCredentials? Credentials { get; set; }
}

public class UserCredentials {
    public string? Username { get; set; }
    public string? Password { get; set; }
}

public class UsersList
{
    public List<UserViewModel> Users { get; set; } = new List<UserViewModel>();
}