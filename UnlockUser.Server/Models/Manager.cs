using System.Runtime.Serialization;

namespace UnlockUser.Server.Models;

public class Manager
{
    public string? Username { get; set; }
    public string? DisplayName { get; set; }
    public string? Division { get; set; }

    [IgnoreDataMember]
    public string? Primary => DisplayName;
    [IgnoreDataMember]
    public string? Secondary => Division;
}
