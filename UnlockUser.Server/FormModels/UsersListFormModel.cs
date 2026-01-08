namespace UnlockUser.Server.FormModels;

public class UsersListFormModel : UserForm
{
    public UserForm UserForm { get; set; }
    public List<UserFormModel> Users { get; set; } = [];
}

public class UserForm
{
    public bool Check { get; set; }
    public string? GroupName { get; set; }
    public string? Office { get; set; }
    public string? Department { get; set; }
}

