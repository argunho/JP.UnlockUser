using Google.Apis.Admin.Directory.directory_v1;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using UserModel = UnlockUser.Server.Models.User;
using GoogleUserModel = Google.Apis.Admin.Directory.directory_v1.Data.User;

namespace UnlockUser.Server.IServices;

public class GoogleService(IConfiguration config, ILocalFileService localFileService, ILogger<GoogleService> logger) : IGoogleService
{
    private readonly IConfiguration _config = config;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly ILogger<GoogleService> _logger = logger;

    public async Task<List<UserModel>> GetStudentsFromGoogle()
    {
        List<UserModel> users = [];
        try
        {
            var service = Service();
            string? pageToken = null;

            do
            {
                var request = service.Users.List();
                request.Customer = _config["CustomerId"] ?? "my_customer";
                request.MaxResults = 500;
                request.PageToken = pageToken;
                var res = await request.ExecuteAsync();
                if (res.UsersValue == null)
                    break;

                var resUsers = res.UsersValue?.Where(x =>
                    x.Organizations != null
                    && string.Equals(x.Organizations[0]?.Title, "Student", StringComparison.OrdinalIgnoreCase)
                    && x.ExternalIds != null
                    && x.Archived != true
                    ).Select(s => new UserModel
                    {
                        DisplayName = s.Name.FullName,
                        Username = s.ExternalIds[0]?.Value,
                        Email = s.PrimaryEmail,
                        Department = s.Organizations[0]?.Department,
                        Office = s.Organizations[0]?.Location,
                        Title = s.Organizations[0]?.Title,
                        LastLoginTime = s.LastLoginTimeRaw
                    }).ToList() ?? [];

                users.AddRange(resUsers);

                pageToken = res.NextPageToken;
            } while (!string.IsNullOrEmpty(pageToken));


            return users;
        }
        catch (Google.GoogleApiException gex)
        {
            _logger.LogError($"{nameof(GetStudentsFromGoogle)} Error: {0}", gex.Error?.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError($"{nameof(GetStudentsFromGoogle)} Error: {0}", ex?.Message);
        }

        return users;
    }

    public async Task<List<GoogleUserModel>> GetUsers()
    {
        try
        {
            var service = Service();

            var request = service.Users.List();
            request.Customer = _config["CustomerId"] ?? "my_customer";
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
            _logger.LogError($"{nameof(GetStudentsFromGoogle)} Error: {0}", gex.Error?.Message);
        }

        return [];
    }

    public async Task UpdatePaswords(List<UserFormModel> models)
    {
        var service = Service();

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
    private DirectoryService Service()
    {
        var credential = GoogleCredential.FromFile(@"wwwroot/service/service.json")
                    .CreateScoped(
                        DirectoryService.Scope.AdminDirectoryUser)
                    .CreateWithUser("aslan.khadizov@edualvesta.se");

        var service = new DirectoryService(
            new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "UnlockUser"
            });

        return service;
    }
    #endregion
}
