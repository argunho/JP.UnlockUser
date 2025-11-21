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
    public DateTime Date { get; set; } = DateTime.Now;

    public string? Primary => $"{Source}<br/><span class='secondary{(Opened ? " open" : "")}'>{Description}</span>";
    public string Secondary => $"<br/>Registrerad: {Date:g}";
}