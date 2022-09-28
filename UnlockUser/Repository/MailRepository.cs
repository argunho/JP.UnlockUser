using UnlockUser.ViewModels;
using UnlockUser.Controllers;
using UnlockUser.Interface;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Net.Mail;

namespace UnlockUser.Repositories;

public class MailRepository
{

    // Template params
    private static string mailHtml = "<div style=\"width:98%;display:block;margin:auto;background-color:#FFFFFF;font-family:Tahoma\">" +
                                        "<div style=\"width:100%;display:block;background:#FFF;border-bottom:2px solid #198938\">" +
                                            "<img src=\"data:image/png;base64,{logo}\" alt='Alvesta Kommun' width='150' height='75' style=\"display: block;margin: 30pt\"/></div>" +
                                        "<div style=\"width:auto;padding:35px 25px;font-size:'14px';display:block;\"><br/><br/>{content}</div>" +
                                        "<div style=\"width:96%;margin:20px 1%;display:block;padding:25px 1%;text-align:center;line-height:25px;font-size:16px;border-top:1px solid #D8D8D8;display:flex;justify-content:center;\">" +
                                            "<div style=\"width:50%;min-width:320px;display:block;margin:auto;font-family:Franklin Gothic Medium;\">" +
                                            "</div></div></div>";

    public static string? _message { get; set; }

    // Send mail service
    public bool SendMail(string toEmail, string mailSubject, string mailContent, string emailFrom, string password, IFormFile? attachedFile = null)
    {

        try
        {
            var logo = ImageToBase64(@"wwwroot/alvestakommun.png");
            MailMessage _mail = new MailMessage(new MailAddress("no-reply@alvesta.se", "Unlock User"), new MailAddress(toEmail));
            _mail.Subject = mailSubject;
            _mail.Body = mailHtml.Replace("{content}", mailContent).Replace("{logo}", logo);
            _mail.IsBodyHtml = true;
            if (attachedFile != null)
            {
                _mail.Attachments.Add(new Attachment(attachedFile.OpenReadStream(), mailSubject + "."
                        + attachedFile.ContentType.Substring(attachedFile.ContentType.IndexOf("/") + 1)));
            }

            SmtpClient _smtp = new SmtpClient();
            _smtp.Host = "smtp.alvesta.local";
            _smtp.Port = 25;
            _smtp.EnableSsl = false;
            _smtp.DeliveryMethod = SmtpDeliveryMethod.Network;

            NetworkCredential credential = new NetworkCredential();
            credential.UserName = emailFrom;
            credential.Password = password;
            _smtp.UseDefaultCredentials = false;
            _smtp.Credentials = credential;

            _smtp.Send(_mail);
            return true;
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            _message = ex.Message;
            return false;
        }
    }

    public bool SendContactEmail(ContactViewModel model) // Email sending without user's email credentials
    {
        try
        {
            var logo = ImageToBase64(@"wwwroot/alvestakommun.png");
            MailMessage _mail = new MailMessage(new MailAddress("unlock.contact@alvesta.se", "Unlock User"), new MailAddress("aslan.khadizov@alvesta.se"));
            SmtpClient _smtp = new SmtpClient("smtp.alvesta.local");
            _mail.Subject = model.Title;
            _mail.Body = mailHtml.Replace("{content}", model.Text).Replace("{logo}", logo);
            _mail.IsBodyHtml = true;
            _smtp.Send(_mail);
            return true;
        }catch(Exception ex)
        {
            Debug.WriteLine(ex.Message);
            _message = ex.Message;
            return false;
        }
    }

    #region Help methods
    public string ImageToBase64(string imgUrl = "")
    {
        string imgBase64 = "";
        using (Image img = Image.FromFile(imgUrl))
        {
            using (MemoryStream m = new MemoryStream())
            {
                Image imageToConvert = img;
                imageToConvert.Save(m, img.RawFormat);
                byte[] imageBytes = m.ToArray();
                imgBase64 = Convert.ToBase64String(imageBytes);
            }
        }
        return imgBase64;
    }
    #endregion
}
