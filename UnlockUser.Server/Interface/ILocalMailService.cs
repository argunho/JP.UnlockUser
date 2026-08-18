namespace UnlockUser.Server.Interface;

public interface ILocalMailService
{
    void SendMail(string toEmail, string mailSubject, string mailContent, IFormFile? attachedFile = null);
    void SendContactEmail(ContactViewModel model);
}
