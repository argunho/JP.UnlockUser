
using Newtonsoft.Json;
using System.Diagnostics;

namespace UnlockUser.Server.Services;

public class TaskScheduleService(IServiceScopeFactory scope, ILogger<TaskScheduleService> logger, IConfiguration config) : IHostedService, IDisposable
{
    private int _execution = 0;
    private Timer _timer;
    private readonly IServiceScopeFactory _serviceScope = scope;
    private readonly ILogger<TaskScheduleService> _logger = logger;
    private readonly IConfiguration _config = config;


    public Task StartAsync(CancellationToken cancellationToken)
    {
        _timer = new Timer(Run, null, TimeSpan.Zero, TimeSpan.FromHours(1));
        return Task.CompletedTask;
    }

    private void Run(object state)
    {
        using var scope = _serviceScope.CreateScope();
        try
        {
            //var secondsPerDay = 86400000;
            var currentDate = DateTime.Now;
            var currentHour = currentDate.Hour;
            var currentDay = currentDate.Day;

            _ = Task.Run(async () =>
            {
                // Send remind mail to participants
                var appConfig = AppConfiguration.Load();
                var updated = Convert.ToDateTime(appConfig.LastUpdatedDate);

                if (currentHour >= 8 && currentHour < 18)
                {
                    _logger.LogInformation(currentDate.ToString());

                    if (updated.Day != currentDate.Day)
                    {
                        //var provider = new ADService();
                        //await provider.RenewUsersJsonList(config);
                        UpdateConfigFile("appconfig", "LastUpdatedDate", currentDate.ToString("yyyy.MM.dd HH:mm:ss"));
                    }

                }
            });

        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
        }

        Interlocked.Increment(ref _execution);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose() => _timer.Dispose();

    #region Help
    //Update configuration json
    public void UpdateConfigFile(string config, string? parameter, string? value, string? obj = null)
    {
        try
        {
            var configJsonFile = File.ReadAllText($"{config}.json");
            dynamic configJson = JsonConvert.DeserializeObject(configJsonFile);

            if (configJson != null)
            {
                if (obj != null)
                    configJson[obj][parameter] = value;
                else
                    configJson[parameter] = value;

                var configJsonToUpdate = JsonConvert.SerializeObject(configJson);
                File.WriteAllText($"{config}.json", configJsonToUpdate);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
        }
    }
    #endregion
}