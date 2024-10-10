namespace UnlockUser.Server.DataModels;

public class AppConfiguration
{
    public string? LastUpdatedDate { get; set; }
    public string? ServiceWork { get; set; }

    public static AppConfiguration Load()
    {
        IConfiguration config = new ConfigurationBuilder().AddJsonFile("appconfig.json", optional: false)
                                    .AddJsonFile($"appconfig.Development.json", optional: true).Build();

        return config.Get<AppConfiguration>() ??
            throw new Exception("Något har gått snett! Kunde inte laddas app configuration inställningar.");
    }
}
