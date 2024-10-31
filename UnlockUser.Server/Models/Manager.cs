using System.Runtime.Serialization;
using System.Xml.Linq;

namespace UnlockUser.Server.Models;

public class Manager
{
    public string? Username { get; set; }
    public string? DisplayName { get; set; }
    public string? Division { get; set; }
    public bool Disabled { get; set; }
}
