namespace UnlockUser.Server.Interface;

public interface ILocalMailService
{
    bool SendMail(string toEmail, string mailSubject, string mailContent, string emailFrom, string password, IFormFile? attachedFile = null);
    bool SendContactEmail(ContactViewModel model);
}
