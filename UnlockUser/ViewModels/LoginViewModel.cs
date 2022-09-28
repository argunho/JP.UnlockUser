using System.ComponentModel.DataAnnotations;

namespace UnlockUser.ViewModels;

public class LoginViewModel
{
    [Required]
    public string Username { get; set; } = String.Empty;
    [Required]
    public string Password { get; set; } = String.Empty;
    [Required]
    public string Group { get; set; } = String.Empty;
    public string? BlockTime { get; set; }
}
