using System.Runtime.Serialization;

namespace UnlockUser.Server.Models;

public class School
{
    public string? Name { get; set; }
    public string? Place { get; set; }

    [IgnoreDataMember]
    public string? Primary => Name;
    [IgnoreDataMember]
    public string? Secondary => Place;
}
