namespace UnlockUser.Server.ViewModels;

public class PermissionsViewModel
{
    public List<string> Groups { get; set; } = [];
    public List<string> Managers { get; set; } = [];
    public List<string> Schools { get; set; } = [];
}
