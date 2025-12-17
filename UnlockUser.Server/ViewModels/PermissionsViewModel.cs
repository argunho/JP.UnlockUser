namespace UnlockUser.Server.ViewModels;

public class PermissionsViewModel
{
    public List<string> PasswordManageGroups { get; set; } = [];
    public List<string> Managers { get; set; } = [];
    public List<string> Offices { get; set; } = [];
}
