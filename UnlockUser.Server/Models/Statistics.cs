namespace UnlockUser.Server.Models;

public class Statistics
{
    public int Year { get; set; }
    public List<Months> Months { get; set; } = [];
}

public class Months
{
    public string? Name { get; set; }
    public int PasswordsChange { get; set; }
    public int Unlocked { get; set; }
}