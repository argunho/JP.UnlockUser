namespace UnlockUser.Server.DataModels;

public class ConfigurationAzureModel
{
    public string? TenantId { get; set; }
    public string? ClientId { get; set; }
    public string[] Scopes { get; set; } = [];
    public string? ClientSecretId { get; set; }
    public string? ClientSecretIdExpires { get; set; }
    public string? ChefGroupId { get; set; }
    public string? AdminGroupId { get; set; }
    public string? TaskUserGroupId { get; set; }
    public string? DeveloperGroupId { get; set; }

    public static ConfigurationAzureModel Load()
    {
        IConfiguration config = new ConfigurationBuilder().AddJsonFile("appsettings.json", optional: false)
                                    .AddJsonFile($"appsettings.Development.json", optional: true).Build();

        return config.GetRequiredSection("AzureAd").Get<ConfigurationAzureModel>() ??
            throw new Exception("Något har gått snett! Kunde inte laddas azure ad configuration inställningar.");
    }
}
