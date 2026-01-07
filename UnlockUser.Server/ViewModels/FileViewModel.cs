using System.Text.Json.Serialization;

namespace UnlockUser.Server.ViewModels;

public class FileViewModel
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Date { get; set; } = DateTime.Now.ToString("g");

    [JsonIgnore]
    public string Download => $"{Name}\n\n{Description}\n\n{Date}";
}
