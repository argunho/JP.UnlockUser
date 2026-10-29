
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UnlockUser.Server.Models;

public class ArticleModel
{
    public string? Id { get; set; }

    [Required]
    public string? Name { get; set; }

    [Required]
    public string? Html { get; set; }

    public bool Popup { get; set; }

    public List<string> Groups { get; set; }

    public int OrderById { get; set; }

    public List<string> Hidden { get; set; }


    [NotMapped]
    public string? Primary => string.IsNullOrEmpty(Name) ? null : Name!.Replace("_", " ");

    [NotMapped]
    public string? FileName { get; set; }
}
