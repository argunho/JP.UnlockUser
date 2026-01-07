using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UnlockUser.Server.Models;

public class LogViewModel
{
    [Key]
    public string? Id { get; set; } = Guid.NewGuid().ToString();
    public string? Source { get; set; }
    public string? Description { get; set; }
    public bool Opened { get; set; }
    public string? Date { get; set; }

    public string? Primary => Description;
    public string Secondary => $"Registrerad: {Date}";

    [JsonIgnore]
    public string Download => $"{Source}\n\n{Description}\n\n{Date}";
}