namespace UnlockUser.Server.DataModels;

public class AppConfiguration
{
    public string? LastRemindDate { get; set; }
    public string? CleandDate { get; set; }
    public string? ServiceWork { get; set; }

    public static AppConfiguration Load()
    {
        IConfiguration config = new ConfigurationBuilder().AddJsonFile("appconfig.json", optional: false)
                                    .AddJsonFile($"appconfig.Development.json", optional: true).Build();

        return config.Get<AppConfiguration>() ??
            throw new Exception("Något har gått snett! Kunde inte laddas app configuration inställningar.");
    }
}
