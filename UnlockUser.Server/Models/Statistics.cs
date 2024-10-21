namespace UnlockUser.Server.Models;

public class Statistics
{
    public string? Year { get; set; }
    public int Count { get; set; }
    public List<Months> Months { get; set; } = [];
}

public class Months {
    public string? Name { get; set; }
    public int Count { get; set; }
}