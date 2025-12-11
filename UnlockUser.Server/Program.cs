global using UnlockUser.Server.DataModels;
global using UnlockUser.Server.Extensions;
global using UnlockUser.Server.Interface;
global using UnlockUser.Server.IServices;
global using UnlockUser.Server.Models;
global using UnlockUser.Server.Services;
global using UnlockUser.Server.ViewModels;
global using JobRelatedHelpLibrary.Interfaces;

using JobRelatedHelpLibrary.Extenssions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;


var builder = WebApplication.CreateBuilder(args);


#region Implemented
ConfigurationManager configuration = builder.Configuration;

// Services
builder.Services.AddSingleton<IActiveDirectory, ADService>();
builder.Services.AddSingleton<IHelp, HelpService>();
builder.Services.AddSingleton<ILocalFileService, LocalFileService>();
builder.Services.AddSingleton<ILocalService, LocalService>();

#region Help package library
// Help library pacjage services
builder.Services.AddHelpLocalServices();

// Remove JobRelatedHelpLibrary service IRequestApiService and IMailService if they are registered by default
var requestApiDescriptor = builder.Services.FirstOrDefault(
    d => d.ServiceType == typeof(IRequestApiService));
if (requestApiDescriptor != null)
{
    builder.Services.Remove(requestApiDescriptor);
}
var mailDescriptor = builder.Services.FirstOrDefault(
    d => d.ServiceType == typeof(IMailService));
if (mailDescriptor != null)
{
    builder.Services.Remove(mailDescriptor);
}



// Replace default registration with one that passes required value if IRequestApiServices is needed
//builder.Services.AddScoped<IRequestApiService>(sp =>
//    new RequestApiService("https://example.com")); 
#endregion

// Authennticatio with Jwt ---
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JwtSettings:Key"])),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// Add http accessor ---
builder.Services.AddHttpContextAccessor();

// Add session ---
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    //options.IdleTimeout = TimeSpan.FromSeconds(1800); ---
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Add services to the container.
builder.Services.AddControllers().AddControllersAsServices();

// Services
builder.Services.AddHostedService<TaskScheduleService>();
#endregion

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();

app.UseAuthorization();
app.UseSession(); // ---


app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();