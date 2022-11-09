using System.DirectoryServices.AccountManagement;

namespace UnlockUser.Models;
public class GruopParameters
{
    public string? Keywords { get; set; }
    public string? ToManage { get; set; }
    public string? WithCredentials { get; set; }
}

public class GroupsList
{

    public static List<GruopParameters> Groups = new List<GruopParameters>
    {
        new GruopParameters{Keywords = "Politician", ToManage = "Ciceron-Assistentanvändare", WithCredentials = "Password Reset Politiker" },
        new GruopParameters{Keywords = "Students", ToManage = "Students", WithCredentials = "Password Reset Students-EDU" },
        new GruopParameters{Keywords = "Employees", ToManage = "Employees", WithCredentials = "Password Reset-ADM" }
    };
}
