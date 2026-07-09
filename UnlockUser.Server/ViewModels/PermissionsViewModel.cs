namespace UnlockUser.Server.ViewModels;

public class PermissionsViewModel
{
    public List<string> Groups { get; set; } = [];
    public List<string> Managers { get; set; } = [];
    public List<string> Politicians { get; set; } = [];
    public List<ApprovedEmployee> ApprovedEmployees { get; set; } = [];
    public List<string> Schools { get; set; } = [];
}


public class ApprovedEmployee
{
    public string? Username { get; set; }
    public List<string>? Moderators { get; set; }
}