namespace UnlockUser.Server.FormModels;

public class CatalogsFormModel
{
    public string? Username { get; set; }
    public List<string> Names { get; set; } = [];
    public List<string> Managers { get; set; } = [];
    public List<string> Politicians { get; set; } = [];
    public List<ApprovedEmployeeViewModel> ApprovedEmployees { get; set; } = [];
    public List<string> Schools { get; set; } = [];
}
}
