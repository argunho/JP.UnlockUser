using System.Text.RegularExpressions;

namespace UnlockUser.Server.Models;

public class MessageViewModel
{
    public string? Name { get; set; }
    public string? Html { get; set; }
    public List<string> Watched { get; set; } = [];

    public string Primary => Regex.Replace(Name!, @"^\d+\.", "");
}
