global using JobRelatedHelpLibrary.Interfaces;
global using UnlockUser.Server.DataModels;
global using UnlockUser.Server.Extensions;
global using UnlockUser.Server.Interface;
global using UnlockUser.Server.IServices;
global using UnlockUser.Server.Models;
global using UnlockUser.Server.Services;
global using UnlockUser.Server.ViewModels;
using JobRelatedHelpLibrary.Extenssions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using System.Text;


var builder = WebApplication.CreateBuilder(args);


#region Implemented
ConfigurationManager configuration = builder.Configuration;

// Ensure log directory exists
Directory.CreateDirectory("wwwroot/logs");


// Replace default logging with Serilog
builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        // Default level for your app
        .MinimumLevel.Information()
        // Suppress framework noise
        .MinimumLevel.Override("Microsoft", LogEventLevel.Error)
        .MinimumLevel.Override("System", LogEventLevel.Error)
        .WriteTo.Console()
        // Normal logs (no errors)
        .WriteTo.Logger(lc => lc
            .Filter.ByExcluding(e => e.Level >= LogEventLevel.Error)
            .WriteTo.File(
                "wwwroot/logs/app-.txt",
                rollingInterval: RollingInterval.Day,
                shared: true,
                retainedFileCountLimit: 30,
                fileSizeLimitBytes: 10_000_000, // optional
                rollOnFileSizeLimit: true)
        )
        // Error-only logs (separate file)
        .WriteTo.Logger(lc => lc
            .Filter.ByIncludingOnly(e => e.Level >= LogEventLevel.Error)
            .WriteTo.File(
                "wwwroot/logs/errors-.txt",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30,
                fileSizeLimitBytes: 10_000_000, // optional
                rollOnFileSizeLimit: true
             )
       );
});

// Services
builder.Services.AddSingleton<IActiveDirectory, ADService>();
builder.Services.AddSingleton<IHelp, HelpService>();
builder.Services.AddSingleton<ILocalFileService, LocalFileService>();
builder.Services.AddSingleton<ILocalUserService, LocalUserService>();
builder.Services.AddSingleton<ILocalMailService, MailService>();

#region Help package library
// Help library pacjage services
builder.Services.AddHelpLocalServices();

// Remove JobRelatedHelpLibrary service IRequestApiService and IMailService if they are registered by default
var requestApiDescriptor = builder.Services.FirstOrDefault(d => d.ServiceType == typeof(IRequestApiService));
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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JwtSettings:Key"]!)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// Add http accessor ---
builder.Services.AddHttpContextAccessor();

// Add session ---
builder.Services.AddMemoryCache();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    //options.IdleTimeout = TimeSpan.FromSeconds(1800); ---
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Add services to the container.
builder.Services.AddControllers();   //.AddControllersAsServices();

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