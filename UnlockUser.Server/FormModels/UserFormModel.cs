using System.ComponentModel.DataAnnotations;

namespace UnlockUser.Server.FormModels;

public class UserFormModel
{
    public string? Name { set; get; }
    public string? Username { get; set; }

    [DataType(DataType.Password)]
    public string? Password { get; set; }

    [DataType(DataType.Password)]
    public string? ConfirmPassword { get; set; }


    public bool Check { get; set; }
    public string? Office { get; set; }
    public string? Department { get; set; }
    public  string? GroupName { get; set; }
}

