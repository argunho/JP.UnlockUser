using System.ComponentModel.DataAnnotations;

namespace IneventoryApi.Models;
public class DeviceType
{
    [Key]
    public int Id { get; set; }
    public string? Name { get; set; }
}
