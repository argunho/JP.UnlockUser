
using System.ComponentModel.DataAnnotations;

namespace UnlockUser.Server.Models;

public class Manual
{
    public string? Id { get; set; }

    [Required]
    public string? Name { get; set; }

    [Required]
    public string? Html { get; set; }

    public string? Primary => Name!.Replace("_", " ");
}
