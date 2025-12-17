using System.ComponentModel.DataAnnotations.Schema;

namespace UnlockUser.Server.ViewModels;

public class SchoolViewModel : School
{
    public string? Primary => Name;
}
