namespace UnlockUser.Server.ViewModels;

public class ListViewModel
{
    public string? Primary { get; set; }
    public string? Secondary { get; set; }
    public List<ListViewModel> IncludedList { get; set; } = [];
}