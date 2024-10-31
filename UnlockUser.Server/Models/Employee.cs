namespace UnlockUser.Server.Models;

public class Employee
{
    public string? Username { get; set; }
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? Manager { get; set; }
    public string? Office { get; set; }
    public string? Division { get; set; }
    public string? Title { get; set; }
    public List<string> Offices { get; set; } = [];
    public List<Manager> Managers { get; set; } = [];
}
