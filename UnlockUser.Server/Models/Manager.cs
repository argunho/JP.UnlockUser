namespace UnlockUser.Server.Models;

public class Manager
{
    public string? Username { get; set; }
    public string? DisplayName { get; set; }
    public string? Division { get; set; }
    public bool Disabled { get; set; }
    public bool Default { get; set; } = true;
}
