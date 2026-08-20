using System.Net;
using System.Net.Mail;

namespace UnlockUser.Server.Services;

public class MailService(IHelpService helpService, ICredentialsService credentialsService, IConfiguration config, ILogger<MailService> logger) : ILocalMailService
{

    private readonly IHelpService _helpService = helpService;
    private readonly ICredentialsService _credentialsService = credentialsService;
    private readonly IConfiguration _config = config;
    private readonly ILogger<MailService> _logger = logger;

    // Template params
    private static string mailHtml = "<div style=\"margin:0;padding:12px;background-color:#f4f6f8;font-family:Segoe UI, Tahoma, sans-serif;color:#333;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%\">\r\n" +
        "<div style=\"width:100%;max-width:600px;margin:0 auto;background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.1);box-sizing:border-box\\\">\r\n" +
            "<div style=\"padding:20px 24px;background-color:#FFFFFF;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e6e9ef;box-sizing:border-box\">\r\n" +
                "<div style=\"font-size:18px;font-weight:600;\">Unlock User</div>\r\n" +
                "<img src=\"data:image/png;base64,{logo}\" alt=\"Alvesta Kommun\" style=\"height:48px\"/>\r\n" +
            "</div>\r\n" +
            "<div style=\"padding:24px;font-size:14px;line-height:1.6;color:#333\">\r\n{content}\r\n</div>\r\n" +
            "<div style=\"margin-top:30px;padding:16px 24px;background-color:#f7f9fb;text-transform:uppercase;color:#6b7280;border-top:1px solid #e6e9ef\">\r\n" +
                "<p style=\"max-width:800px;margin:0 auto 8px auto;text-align:center\"><a href=\"https://unlock.alvesta.se\" target=\"_blank\" style=\"color:#0069b4;font-size:12px;text-decoration:none\">Besök Unlock User</a></p>" +
                "<p style=\"max-width:800px;margin:3px auto 0 auto;text-align:center;font-size:9px;leter-spacing:0.5px;color:#9aa0a6\">\r\nDetta e-postmeddelande skickades från Unlock User · Alvesta Kommun\r\n</p>" +
            "</div>\r\n\r\n" +
        "</div></div>";

    // Send mail service
    public async Task SendMail(List<string> recipients, string mailSubject, string mailContent, IFormFile? attachedFile = null)
    {
        try
        {
            var emailFrom = _credentialsService.GetClaim("email");
            var password = _helpService.DecodeFromBase64("HashedCredential").Replace(_config["JwtSettings:Key"]!, "") ?? "";

            var path = Path.Combine(@"wwwroot/images/", "alvestakommun.png");
            var logo = ImageToBase64(path);
            //MailMessage _mail = new(new MailAddress("no-reply@alvesta.se", "Unlock User"), new MailAddress(toEmail))
            //{
            //    Subject = mailSubject,
            //    Body = mailHtml.Replace("{content}", mailContent).Replace("{logo}", logo),
            //    IsBodyHtml = true
            //};
            var fromAddress = new MailAddress("no-reply@alvesta.se", "Unlock User");
            MailMessage _mail = new()
            {
                From = fromAddress,
                Subject = mailSubject,
                Body = mailHtml.Replace("{content}", mailContent).Replace("{logo}", logo),
                IsBodyHtml = true
            };

            // Support multiple recipients in toEmail (comma- or semicolon-separated)
            //if (!string.IsNullOrWhiteSpace(toEmails))
            //{
                //var recipients = toEmail.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var recipient in recipients)
                {
                    var addr = recipient.Trim();
                    if (!string.IsNullOrEmpty(addr))
                    {
                        _mail.To.Add(new MailAddress(addr));
                    }
                }
            //}

            if (attachedFile != null)
            {
                _mail.Attachments.Add(new Attachment(attachedFile.OpenReadStream(), string.Concat(mailSubject, "."
                                , attachedFile.ContentType.AsSpan(attachedFile.ContentType.IndexOf('/') + 1))));
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
            _logger.LogError($"Error: {ex.Message}");
            await _helpService.Error(ex);
        }
    }

    public async Task SendContactEmail(ContactViewModel model) // Email sending without user's email credentials
    {
        try
        {
            var logoImagePath = Path.Combine(@"wwwroot/images", "alvestakommun.png");
            var logoImg = ImageToBase64(logoImagePath);
            var contactsImagePath = Path.Combine(@"wwwroot/images", "contacts.png");
            var contactsImg = ImageToBase64(contactsImagePath);
            MailMessage _mail = new(new MailAddress("contact.unlock.user@alvesta.se", "Unlock User"), new MailAddress("it.flow@alvesta.se"));
            SmtpClient _smtp = new("smtp.alvesta.local");
            _mail.Subject = model.Title;
            _mail.Body = mailHtml.Replace("{content}", model.Text).Replace("{logo}", logoImg).Replace("{contacts}", contactsImagePath);
            _mail.IsBodyHtml = true;
            _smtp.Send(_mail);
        }
        catch (Exception ex)
        {
            _logger.LogError($"{nameof(SendContactEmail)}. \nError: {ex.Message}");
            await _helpService.Error(ex);
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
