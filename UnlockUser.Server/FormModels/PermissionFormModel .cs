using System.ComponentModel.DataAnnotations;

namespace UnlockUser.Server.FormModels;

public class PermissionFormModel
{
    [Required]
    public string? Username { get; set; }
    [Required]
    public string? Type { get; set; }
    [Required]
    public List<string> Permissions { get; set; } = [];
}