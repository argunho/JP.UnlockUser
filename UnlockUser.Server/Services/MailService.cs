using JobRelatedHelpLibrary.Implementations;
using System.Diagnostics;
using System.Net;
using System.Net.Mail;
using System.Runtime.CompilerServices;

namespace UnlockUser.Server.Services;

public class MailService(IHelpService helpService, ICredentialsService credentialsService, IConfiguration config, ILogger<MailService> logger) : ILocalMailService
{

    private readonly IHelpService _helpService = helpService;
    private readonly ICredentialsService _credentialsService = credentialsService;
    private readonly IConfiguration _config = config;
    private readonly ILogger<MailService> _logger = logger;

    // Template params
    private static string mailHtml = "<div style=\"width:98%;display:block;margin:auto;background-color:#FFFFFF;font-family:Tahoma\">" +
                                        "<div style=\"width:100%;display:block;background:#FFF;border-bottom:2px solid #198938\">" +
                                            "<img src=\"data:image/png;base64,{logo}\" alt='Alvesta Kommun' width='150' height='75' style=\"display: block;margin: 15pt\"/></div>" +
                                        "<div style=\"width:auto;padding:15px 10px;font-size:'14px';display:block;\"><br/>{content}</div></div>";

    // Send mail service
    public void SendMail(string toEmail, string mailSubject, string mailContent, IFormFile? attachedFile = null)
    {
        try
        {
            var emailFrom = _credentialsService.GetClaim("email");
            var password = _helpService.DecodeFromBase64("HashedCredential").Replace(_config["JwtSettings:Key"]!, "") ?? "";

            var path = Path.Combine(@"wwwroot/images/", "alvestakommun.png");
            var logo = ImageToBase64(path);
            MailMessage _mail = new(new MailAddress("no-reply@unlockuser.alvesta.se", "Unlock User"), new MailAddress(toEmail))
            {
                Subject = mailSubject,
                Body = mailHtml.Replace("{content}", mailContent).Replace("{logo}", logo),
                IsBodyHtml = true
            };

            if (attachedFile != null)
            {
                _mail.Attachments.Add(new Attachment(attachedFile.OpenReadStream(), mailSubject + "."
                     + attachedFile.ContentType.Substring(attachedFile.ContentType.IndexOf("/") + 1)));
            }

            SmtpClient _smtp = new()
            {
                Host = "smtp.alvesta.local",
                Port = 25,
                EnableSsl = false,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            NetworkCredential credential = new()
            {
                UserName = emailFrom,
                Password = password
            };
            _smtp.UseDefaultCredentials = false;
            _smtp.Credentials = credential;

            _smtp.Send(_mail);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Emai: {toEmail}. \nError: {ex.Message}");
        }
    }

    public void SendContactEmail(ContactViewModel model) // Email sending without user's email credentials
    {
        try
        {
            var logoImagePath = Path.Combine(@"wwwroot/images", "alvestakommun.png");
            var logoImg = ImageToBase64(logoImagePath);
            var contactsImagePath = Path.Combine(@"wwwroot/images", "contacts.png");
            var contactsImg = ImageToBase64(contactsImagePath);
            MailMessage _mail = new(new MailAddress("contact@unlockuser.alvesta.se", "Unlock User"), new MailAddress("it.flow@alvesta.se"));
            SmtpClient _smtp = new("smtp.alvesta.local");
            _mail.Subject = model.Title;
            _mail.Body = mailHtml.Replace("{content}", model.Text).Replace("{logo}", logoImg).Replace("{contacts}", contactsImagePath);
            _mail.IsBodyHtml = true;
            _smtp.Send(_mail);
        }
        catch (Exception ex)
        {
            _logger.LogError($"{nameof(SendContactEmail)}. \nError: {ex.Message}");
        }
    }

    #region Help methods
    public string ImageToBase64(string imgUrl = "")
    {
        byte[] imgBytes = File.ReadAllBytes(imgUrl);
        string imgBase64 = Convert.ToBase64String(imgBytes);

        //using (Image img = Image.FromFile(imgUrl))
        //{
        //    using (MemoryStream m = new MemoryStream())
        //    {
        //        Image imageToConvert = img;
        //        imageToConvert.Save(m, img.RawFormat);
        //        byte[] imageBytes = m.ToArray();
        //        imgBase64 = Convert.ToBase64String(imageBytes);
        //    }
        //}
        return imgBase64;
    }
    #endregion
}
