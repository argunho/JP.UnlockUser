using System.ComponentModel.DataAnnotations;

namespace IneventoryDB.Models;
public class User
{
    [Key]
    public int Id { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Username { get; set; }
    public Title? Title { get; set; }
    public Office Office { get; set; }
    public Department? Department { get; set; }
    public Division? Division { get; set; }
    public DateTime LastLogonDateTime { get; set; }
}

