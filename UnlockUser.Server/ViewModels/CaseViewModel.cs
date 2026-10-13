namespace UnlockUser.Server.ViewModels;

public class CaseViewModel
{
    public string? Id { get; set; }
    public string? Primary { get; set; }
    public string? Secondary { get; set; }
    public string? Hidden { get; set; }
    public bool? HasActions { get; set; }
    public int OlderThan { get; set; }
    public List<CaseViewModel> Values { get; set; } = [];
}
