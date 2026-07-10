namespace UnlockUser.Server.ViewModels;

public class UserViewModel : User
{
    public int PasswordLength { get; set; } = 8;
    public string? Group { get; set; }
    public string? Primary => DisplayName;
    public string? Secondary => $"{Username},\t{Email} | <span class=\"secondary-span\">{Office + (Office != Department ? (" " + Department) : "")}</span>";
    //public int Year => Name != null ? int.Parse(Name[..2]) : 0;

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
            IsLocked = user!.IsLocked || false;
            Permissions = user?.Permissions;
        }
    }
}
