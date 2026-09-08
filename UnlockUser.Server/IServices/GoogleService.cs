using Google.Apis.Admin.Directory.directory_v1;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Microsoft.Extensions.Caching.Memory;
using System.Text;
using GoogleUserModel = Google.Apis.Admin.Directory.directory_v1.Data.User;
using UserModel = UnlockUser.Server.Models.User;

namespace UnlockUser.Server.IServices;

public class GoogleService(ILocalFileService localFileService, IMemoryCache cache, ILogger<GoogleService> logger) : IGoogleService
{
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly IMemoryCache _cache = cache;
    private readonly ILogger<GoogleService> _logger = logger;

    public async Task<List<UserViewModel>?> GetStudentsFromGoogleApi()
    {
        List<UserModel> users = [];
        try
        {
            if(_cache.TryGetValue("students", out List<UserViewModel> cachedUsers))
            {
                _logger.LogInformation($"{nameof(GetStudentsFromGoogleApi)} Info: Returning cached students from Google Workspace.");
                return cachedUsers;
            }

            var (service, id) = await Service();
            string? pageToken = null;

            do
            {
                var request = service.Users.List();
                request.Customer = id ?? "my_customer";

                // Server-side filtering
                request.Query = "isSuspended=false";
                //request.Query = "orgTitle='Student' isSuspended=false";
                request.Fields = "nextPageToken,users(name,primaryEmail,orgUnitPath,organizations,externalIds,lastLoginTime,archived)";

                request.MaxResults = 500;
                request.PageToken = pageToken;

                var res = await request.ExecuteAsync();
                if (res.UsersValue == null)
                    break;

                //var resUsers = res.UsersValue?.Where(x => x.Organizations.Any() == true
                var resUsers = res.UsersValue?.Where(x =>
                       ((x.Organizations != null && x.Organizations.Any(o => o.Primary == true && (o.Title != null && o.Title.Equals("Student", StringComparison.OrdinalIgnoreCase))))
                            || (x.OrgUnitPath != null && x.OrgUnitPath.StartsWith("/Elever", StringComparison.OrdinalIgnoreCase)))
                        && x.Archived != true
                    ).Select(s =>
                    {
                        var organization = s?.Organizations != null ? s.Organizations?.FirstOrDefault() : null;
                        var department = s?.OrgUnitPath?.Split('/')?.LastOrDefault() ?? organization?.Department;
                        var office = s?.Organizations != null ? organization?.Location : s?.OrgUnitPath?.Split('/', StringSplitOptions.RemoveEmptyEntries).Skip(1).FirstOrDefault();

                        return new UserModel
                        {
                            DisplayName = s.Name.FullName,
                            Username = organization != null ? s.ExternalIds?.FirstOrDefault()?.Value : null,
                            Email = s.PrimaryEmail,
                            Department = department,
                            Office = office,
                            Title = organization?.Title ?? "Student",
                            LastLoginTime = s.LastLoginTimeRaw == "1970-01-01T00:00:00.000Z" ? null : s.LastLoginTimeRaw
                        };
                    }).ToList() ?? [];

                users.AddRange(resUsers);

                pageToken = res.NextPageToken;
            } while (!string.IsNullOrEmpty(pageToken));

            // Users model to view
            var usersViewModel = users?.Select(s => new UserViewModel(s)).ToList();
            if (usersViewModel?.Count > 0)
            {
                _ = usersViewModel!.ConvertAll(x => x.Group = "Stundenter").ToList();
            }

            if(usersViewModel == null || usersViewModel.Count == 0)
            {
                _logger.LogWarning($"{nameof(GetStudentsFromGoogleApi)} Warning: No students found in Google Workspace.");
                return null;
            }

            var options = new MemoryCacheEntryOptions { 
                SlidingExpiration = TimeSpan.FromHours(8), 
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(12) 
            };

            _cache.Set(
                "students",
                usersViewModel,
                options
            );

            return usersViewModel;
        }
        catch (Google.GoogleApiException gex)
        {
            _logger.LogError($"{nameof(GetStudentsFromGoogleApi)} Error: {0}", gex.Error?.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError($"{nameof(GetStudentsFromGoogleApi)} Error: {0}", ex?.Message);
        }

        return null;
    }

    public async Task<List<GoogleUserModel>> GetUsers()
    {
        try
        {
            var (service, id) = await Service();

            var request = service.Users.List();
            request.Customer = id ?? "my_customer";
            request.MaxResults = 500;

            var res = await request.ExecuteAsync();

            var users = res.UsersValue?.Where(x =>
                x.Organizations != null
                && string.Equals(x.Organizations[0]?.Title, "Student", StringComparison.OrdinalIgnoreCase)
                && x.ExternalIds != null
                && x.Archived != true
                ).ToList() ?? [];

            return users;
        }
        catch (Google.GoogleApiException gex)
        {
            _logger.LogError($"{nameof(GetStudentsFromGoogleApi)} Error: {0}", gex.Error?.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError($"{nameof(GetStudentsFromGoogleApi)} Error: {0}", ex?.Message);
        }

        return [];
    }

    public async Task<GoogleUserModel?> GetUser(string email)
    {
        try
        {
            var (service, id) = await Service();
            var user = await service.Users
                    .Get(email)
                    .ExecuteAsync();
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError($"{nameof(GetStudentsFromGoogleApi)} Error: {0}", ex?.Message);
            return null;
        }
    }

    public async Task UpdatePaswords(List<UserFormModel> models)
    {
        var (service, id) = await Service();

        foreach (var model in models)
        {
            var update = new GoogleUserModel
            {
                Password = model.Password
            };

            await service.Users.Update(
                update,
                model.Email)
                .ExecuteAsync();
        }
    }

    #region Private methods
    private async Task<(DirectoryService, string)> Service()
    {
        string? serviceJson = await _localFileService.GetEncryptedFile<string>("services/service");
        var serviceConfig = await _localFileService.GetEncryptedFile<ServiceModel>("services/config");

        if (serviceJson == null || serviceConfig == null)
            throw new Exception();

        //string serviceString = System.Text.Json.JsonSerializer.Serialize(serviceJson);
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(serviceJson));

        var credential = GoogleCredential.FromStream(stream)
            .CreateScoped(DirectoryService.Scope.AdminDirectoryUser)
            .CreateWithUser(serviceConfig.CustomerEmail);

        var service = new DirectoryService(
            new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = serviceConfig.AppName
            });

        return (service, serviceConfig.CustomerId!);
    }
    #endregion
}
