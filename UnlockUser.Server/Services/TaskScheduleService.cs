using System.Diagnostics;

namespace UnlockUser.Server.Services;

public class TaskScheduleService(IServiceScopeFactory scope, ILogger<TaskScheduleService> logger, ILocalUserService localUserService, 
    ILocalFileService localFileService) : IHostedService, IDisposable
{
    private int _execution = 0;
    private Timer _timer;
    private readonly IServiceScopeFactory _serviceScope = scope;
    private readonly ILogger<TaskScheduleService> _logger = logger;
    private readonly ILocalUserService _localUserService = localUserService;
    private readonly ILocalFileService _localFileService = localFileService;



    public Task StartAsync(CancellationToken cancellationToken)
    {
        _timer = new Timer(Run!, null, TimeSpan.Zero, TimeSpan.FromHours(1));
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
                var appConfig = AppConfiguration.Load();
                var updated = Convert.ToDateTime(appConfig.LastUpdatedDate);

                // Update employees in txt file
                
                if (updated.Date != currentDate.Date && currentHour >= 6)
                {
                    // Renew users saved list
                    await _localUserService.RenewUsersCachedList();

                    // Remove old files
                    if (updated.DayOfWeek == DayOfWeek.Monday)
                    {
                        var logs = Directory.GetFiles(@"wwwroot/logs", "*.txt", SearchOption.AllDirectories).ToList();

                        // Remove old files
                        if (logs?.Count > 0)
                        {
                            var oldFiles = logs.Where(x => File.GetLastWriteTime(x).AddMonths(3).Ticks < DateTime.Now.Ticks).ToList();
                            if (oldFiles.Count > 0)
                            {
                                for (var x = 0; x < oldFiles.Count; x++)
                                {
                                    var log = logs[x];
                                    FileInfo fi = new(log);
                                    if (fi != null)
                                    {
                                        File.Delete(log);
                                        fi.Delete();
                                        logs.Remove(log);
                                    }
                                }
                            }
                        }
                    }

                    // Update app config
                    _localFileService.UpdateConfigFile("appconfig", "LastUpdatedDate", currentDate.ToString("yyyy.MM.dd HH:mm:ss"));
                }

            });
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex.Message);
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
}