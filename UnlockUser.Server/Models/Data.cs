namespace  UnlockUser.Server.Models;

public class Data
{
    public string? Office { get; set; }
    public string? Department { get; set; }
    public string? ManagedUserOffice { get; set; }
    public string? ManagedUserDepartment { get; set; }
    public string? Group { get; set; }
    public List<string> Users { get; set; } = [];
    public string? IpAddress { get; set; }
    public string? ComputerName { get; set; }
    public DateTime Date { get; set; } = DateTime.Now;
}

