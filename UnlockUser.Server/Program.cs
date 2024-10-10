global using UnlockUser.Server.Models;
global using UnlockUser.Server.ViewModels;
global using UnlockUser.Server.Services;
global using UnlockUser.Server.IServices;
global using UnlockUser.Server.DataModels;
global using UnlockUser.Server.Interface;
global using UnlockUser.Server.Extensions;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Onboarding.Server.Services;

namespace UnlockUser.Server;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        #region Implemented
        ConfigurationManager configuration = builder.Configuration;

        // Services
        builder.Services.AddScoped<IActiveDirectory, IADService>();
        builder.Services.AddScoped<IHelp, IHelpService>();

        // Signalr
        builder.Services.AddSignalR();
        builder.Services.AddSingleton<IDictionary<string, UserConnection>>(options =>
                new Dictionary<string, UserConnection>());

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

        app.MapHub<HubService>("/hub");
        app.MapFallbackToFile("/index.html");

        app.Run();
    }
}
