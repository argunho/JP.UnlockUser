
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UnlockUser.Server.Models;

public class Manual
{
    public string? Id { get; set; }

    [Required]
    public string? Name { get; set; }

    [Required]
    public string? Html { get; set; }

    [NotMapped]
    public string? Primary => string.IsNullOrEmpty(Name) ? null : Name!.Replace("_", " ");
}
