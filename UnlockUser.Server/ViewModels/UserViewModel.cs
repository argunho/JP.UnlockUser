namespace UnlockUser.Server.ViewModels;

public class UserViewModel : User
{
    public int PasswordLength { get; set; } = 8;
    public  string? Group { get; set; }
    public string? Primary => DisplayName;
    public string? Secondary => $"{Name},\t{Email} | <span class=\"secondary-span\">{Office + (Office != Department ? (" " + Department) : "")}</span>";

    public UserViewModel(User user)
    {
        if (user != null)
        {
            Name = user?.Name;
            DisplayName = user?.DisplayName;
            Email = user?.Email;
            Manager = user?.Manager;
            Department = user?.Department;
            Office = user?.Office;
            Division = user?.Division;
            Title = user?.Title;
            IsLocked = user!.IsLocked || false;
            Permissions = user?.Permissions;
        }
    }
}
