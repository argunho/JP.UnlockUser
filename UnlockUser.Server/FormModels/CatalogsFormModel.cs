namespace UnlockUser.Server.FormModels;

public class CatalogsFormModel : PermissionsModel
{
    public string? Username { get; set; }
    public List<string> Names { get; set; } = [];

    public CatalogsFormModel(PermissionsModel model)
    {
        Managers = model.Managers;
        Politicians = model.Politicians;
        Schools = model.Schools;
        Employees = model.Employees;
        Offices = model.Offices;
    }
}
