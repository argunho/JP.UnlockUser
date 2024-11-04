namespace UnlockUser.Server.ViewModels;

public class ListViewModel
{
    public string? Id { get; set; }
    public string? Primary { get; set; }
    public string? Secondary { get; set; }
    public bool? BoolValue { get; set; }
    public List<ListViewModel> IncludedList { get; set; } = [];
}