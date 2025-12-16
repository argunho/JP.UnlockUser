namespace UnlockUser.Server.ViewModels;

public class UserViewModel : User
{
    public int PasswordLength { get; set; } = 8;
    public string? Primary => DisplayName;
    public string? Secondary => $"{Name},\t{Email} | <span class=\"secondary-span\">{Office + (Office != Department ? (" " + Department) : "")}</span>";

    public UserViewModel(User user)
    {
        Name = user.Name;
        DisplayName = user.DisplayName;
        Email = user.Email;
        Manager = user.Manager;
        Department = user.Department;
        Office = user.Office;
        Division = user.Division;
        Title = user.Title;
        IsLocked = user.IsLocked;
        PasswordManageGroups = user.PasswordManageGroups;
        Offices = user.Offices;
        Managers = user.Managers;

    }
}
