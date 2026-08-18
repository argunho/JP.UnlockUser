using System.ComponentModel.DataAnnotations;

namespace UnlockUser.Server.FormModels;

public class SendEmailFormModel
{
    [Required]
    public string? Group { get; set; }
    public string? CopyTo { get; set; }
    [Required]
    public string? Subject { get; set; }
    [Required]
    public string? Message { get; set; }
}
