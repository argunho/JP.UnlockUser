namespace UnlockUser.Server.Interface;

public interface ILocalMailService
{
    bool SendMail(string toEmail, string mailSubject, string mailContent, IFormFile? attachedFile = null);
    bool SendContactEmail(ContactViewModel model);
}
