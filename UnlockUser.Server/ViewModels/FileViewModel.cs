namespace UnlockUser.Server.ViewModels;

public class FileViewModel
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Date { get; set; } = DateTime.Now.ToString("g");
}
