namespace UnlockUser.Server.ViewModels;

public class AuthViewModel
{
    public string? Token { get; set; }
    public string? GroupName { get; set; }
    public bool Remember { get; set; }
}
