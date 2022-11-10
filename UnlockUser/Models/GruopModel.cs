using System.DirectoryServices.AccountManagement;

namespace UnlockUser.Models;
public class GroupParameters
{
    public string? Name { get; set; }
    public string? ToManage { get; set; }
    public string? WithCredentials { get; set; }
}

public class GroupsList
{

    public static List<GroupParameters> Groups = new List<GroupParameters>
    {
        new GroupParameters{Name = "Politiker", ToManage = "Ciceron-Assistentanvändare", WithCredentials = "Password Reset Politiker" },
        new GroupParameters{Name = "Studenter", ToManage = "Students", WithCredentials = "Password Reset Students-EDU" },
        new GroupParameters{Name = "Personal", ToManage = "Employees", WithCredentials = "Password Reset-ADM" }
    };
}
