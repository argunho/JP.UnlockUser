using System.DirectoryServices.AccountManagement;

namespace UnlockUser.Models;
public class GruopParameters
{
    public string? Name { get; set; }
    public string? ToManage { get; set; }
    public string? WithCredentials { get; set; }
}

public class GroupsList
{

    public static List<GruopParameters> Groups = new List<GruopParameters>
    {
        new GruopParameters{Name = "Politiker", ToManage = "Ciceron-Assistentanvändare", WithCredentials = "Password Reset Politiker" },
        new GruopParameters{Name = "Studenter", ToManage = "Students", WithCredentials = "Password Reset Students-EDU" },
        new GruopParameters{Name = "Personal", ToManage = "Employees", WithCredentials = "Password Reset-ADM" }
    };
}
