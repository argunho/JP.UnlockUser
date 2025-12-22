using System.Text.Json.Serialization;

namespace UnlockUser.Server.Models;

public class Log
{
    public string? Id { get; set; } = Guid.NewGuid().ToString();
    public string? Source { get; set; }
    public string? Type { get; set; }
    public bool Opened { get; set; }

    [JsonRequired]
    public string? Description { get; set; }
    public string? Date { get; set; }

    public string? Primary => Description;
    public string Secondary => $"Registrerad: {Date}";
}