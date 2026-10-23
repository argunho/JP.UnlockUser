namespace UnlockUser.Server.FormModels;

public class CatalogsFormModel : PermissionsModel
{
    public string? Username { get; set; }
    public List<string> Names { get; set; } = [];
}