namespace UnlockUser.Server.ViewModels;

public class UserViewModel : User
{
    public int PasswordLength { get; set; } = 8;
    public string? Group { get; set; }
    public string? Primary => DisplayName;
    public string? Secondary => $"{Username},\t{Email} | <span class=\"secondary-span\">{Office + (Office != Department ? (" | " + Department) : "")}</span>";
    public string? SecondaryKey => Office;

    public UserViewModel(User user)
    {
        if (user != null)
        {
            Username = user?.Username;
            DisplayName = user?.DisplayName;
            Email = user?.Email;
            Manager = user?.Manager;
            Department = user?.Department;
            Office = user?.Office;
            Division = user?.Division;
            Title = user?.Title;
            LastLoginTime = user?.LastLoginTime;
            IsLocked = user!.IsLocked || false;
            Permissions = user?.Permissions;
        }
    }
}
//user?.Registered != null ? Convert.ToDateTime(user?.Registered).ToString("yyyy-MM-dd") : null