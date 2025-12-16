namespace UnlockUser.Server.ViewModels;

public class UsersListViewModel
{
    public List<UserViewModel> Users { get; set; } = [];
    public bool Check { get; set; }
    public string? GroupName { get; set; }
    public string? Office  { get; set; }
    public string? Department { get; set; }
}

