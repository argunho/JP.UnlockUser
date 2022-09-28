using System.ComponentModel.DataAnnotations;

namespace IneventoryDB.Models;

public class Device
{
    [Key]
    public int Id { get; set; }
    public string? Serialumber { get; set; }
    public Modell? Model { get; set; }
    public DeviceType? DeviceType { get; set; }
    public Manufacturer? Manufacturer { get; set; }
    public List<User> LastLogonUser { get; set; }
}
