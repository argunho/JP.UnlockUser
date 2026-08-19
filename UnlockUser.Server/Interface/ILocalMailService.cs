namespace UnlockUser.Server.Interface;

public interface ILocalMailService
{
    Task SendMail(List<string> toEmails, string mailSubject, string mailContent, IFormFile? attachedFile = null);
    Task SendContactEmail(ContactViewModel model);
}
