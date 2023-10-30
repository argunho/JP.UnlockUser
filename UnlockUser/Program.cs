using UnlockUser.Interface;
using UnlockUser.Repository;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
ConfigurationManager configuration = builder.Configuration; // ---

// Add interfaces and repositories --- 
builder.Services.AddScoped<IActiveDirectory, ADRepository>();
builder.Services.AddScoped<IFunctions, FunctionsRepository>();

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

// Add services to the container.
builder.Services.AddControllers();

// Add session ---
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    //options.IdleTimeout = TimeSpan.FromSeconds(1800); ---
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Add windows authentication ---
//builder.Services.AddAuthentication(IISDefaults.AuthenticationScheme);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

// Authorization with Jwt ---
app.UseCors(builder => builder.WithOrigins(configuration["JwtSettings:Url"])
                                .AllowAnyHeader().AllowAnyMethod());

app.UseAuthentication(); // ---
app.UseAuthorization(); // ---

app.UseSession(); // ---

//app.MapControllerRoute(
//    name: "default",
//    pattern: "{controller}/{action=Index}/{id?}");
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllerRoute(
        name: "default",
        pattern: "{controller}/{action=Index}/{id?}");
});

app.MapFallbackToFile("index.html"); ;

app.Run();
