namespace UnlockUser.Server.ViewModels;

public class UserViewModel : User
{
    public int PasswordLength { get; set; } = 8;

    public string? Primary => DisplayName;
    public string? Secondary => $"{Name},\t{Email} | <span class=\"secondary-span\">{Office + (Office != Department ? (" " + Department) : "")}</span>";
}
