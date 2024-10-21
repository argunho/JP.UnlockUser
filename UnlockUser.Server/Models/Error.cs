namespace UnlockUser.Server.Models;

public class Error
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? Title { get; set; }
    public string? Message { get; set; }

}
