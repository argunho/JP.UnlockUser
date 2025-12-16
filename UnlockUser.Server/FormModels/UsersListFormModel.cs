namespace UnlockUser.Server.FormModels;

public class UsersListFormModel
{
    public List<UserFormModel> Users { get; set; } = [];
    public bool Check { get; set; }
    public string? GroupName { get; set; }
    public string? Office  { get; set; }
    public string? Department { get; set; }
}

