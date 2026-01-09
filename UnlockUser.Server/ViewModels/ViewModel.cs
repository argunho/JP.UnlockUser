namespace UnlockUser.Server.ViewModels;

public class ViewModel
{
    public string? Id { get; set; }
    public string? Primary { get; set; }
    public string? Secondary { get; set; }
    public string? Hidden { get; set; }
    public bool? BoolValue { get; set; }
    public List<ViewModel> IncludedList { get; set; } = [];
}