namespace UnlockUser.Server.FormModels;

public class PermissionFormModel
{
    public string? Username { get; set; }
    public string? Type { get; set; }
    public List<string> Permissions { get; set; } = [];
}