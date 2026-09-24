namespace UnlockUser.Server.FormModels;

public class CaseFormModel
{
    public string? Username { get; set; }
    public List<ApprovedEmployeeViewModel> ApprovedEmployees { get; set; } = [];

    public string? Title{ get; set; }
    public string? Text { get; set; }
}
