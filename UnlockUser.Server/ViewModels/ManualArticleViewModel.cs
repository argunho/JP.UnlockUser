
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UnlockUser.Server.ViewModels;

public class ManualArticleViewModel
{
    public string? Id { get; set; }

    [Required]
    public string? Name { get; set; }

    [Required]
    public string? Html { get; set; }

    public bool Popup { get; set; }

    [NotMapped]
    public string? Primary => string.IsNullOrEmpty(Name) ? null : Name!.Replace("_", " ");

    [NotMapped]
    public string? FileName { get; set; }
}
