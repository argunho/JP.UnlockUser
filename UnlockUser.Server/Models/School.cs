namespace UnlockUser.Server.Models;

public class School
{
    public string? Name { get; set; }
    public string? Place { get; set; }

    public string? Primary => Name;
}
