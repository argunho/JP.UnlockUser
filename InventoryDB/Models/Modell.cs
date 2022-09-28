using System.ComponentModel.DataAnnotations;

namespace IneventoryDB.Models;
public class Modell
{
    [Key]
    public int Id { get; set; }
    public string? Name { get; set; }
}

