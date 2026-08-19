using System.ComponentModel.DataAnnotations;

namespace UnlockUser.Server.FormModels;

public class SendEmailFormModel
{
    [Required]
    public string? Subject { get; set; }

    [Required]
    public string? Message { get; set; }

    public string? Group { get; set; }

    public List<string> CopyTo { get; set; } = [];
}
