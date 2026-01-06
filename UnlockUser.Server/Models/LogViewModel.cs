namespace UnlockUser.Server.Models;

public class LogViewModel
{
    public string? Id { get; set; } = Guid.NewGuid().ToString();
    public string? Source { get; set; }
    public string? Description { get; set; }
    public bool Opened { get; set; }
    public string? Date { get; set; }

    public string? Primary => Description;
    public string Secondary => $"Registrerad: {Date}";
}