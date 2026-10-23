namespace UnlockUser.Server.Models;

public class PermissionsModel
{
    public List<string> Groups { get; set; } = [];
    public List<string> Managers { get; set; } = [];
    public List<string> Politicians { get; set; } = [];
    public List<string> Schools { get; set; } = [];
    public List<string> Employees { get; set; } = [];
    public List<string> Offices { get; set; } = [];
}