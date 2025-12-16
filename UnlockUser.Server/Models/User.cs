namespace  UnlockUser.Server.Models;

public class User
{
    public string? Name { get; set; }
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? Manager { get; set; }
    public string? Department { get; set; }
    public string? Office { get; set; }
    public string? Division { get; set; }
    public string? Title { get; set; }
    public bool IsLocked { get; set; }
    public List<string>? PasswordManageGroups { get; set; }
    public List<string> Offices { get; set; } = [];
    public List<Manager> Managers { get; set; } = [];

    public int PasswordLength { get; set; } = 8;

    public string? Primary => DisplayName;
    public string? Secondary =>  $"{Name},\t{Email} | <span class=\"secondary-span\">{Office + (Office != Department ? (" " + Department) : "")}</span>";
}
