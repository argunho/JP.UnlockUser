using System.ComponentModel.DataAnnotations;

namespace UnlockUser.Server.FormModels;

public class CaseFormModel
{
    [Required]
    public string? Username { get; set; }
    [Required]
    public List<ApprovedEmployeeViewModel> ApprovedEmployees { get; set; } = [];

    public string? Title{ get; set; }
    public string? Text { get; set; }
}
