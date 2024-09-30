namespace UnlockUser.ViewModels;

public class GroupUsersViewModel
{
    public GroupModel? Group { get; set; }
    public List<User> Members { get; set; } = new List<User>();
}
