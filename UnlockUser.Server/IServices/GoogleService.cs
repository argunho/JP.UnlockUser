using Google.Apis.Admin.Directory.directory_v1;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using User = UnlockUser.Server.Models.User;

namespace UnlockUser.Server.IServices;

public class GoogleService(IConfiguration config, ILocalFileService localFileService, ILogger<GoogleService> logger) : IGoogleService
{
    private readonly IConfiguration _config = config;
    private readonly ILocalFileService _localFileService = localFileService;
    private readonly ILogger<GoogleService> _logger = logger;

    public async Task<List<User>> GetStudentsFromGoogle()
    {
        List<User> users = [];
        try
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
                    ).Select(s => new User
                    {
                        DisplayName = s.Name.FullName,
                        Username = s.ExternalIds[0]?.Value,
                        Email = s.PrimaryEmail,
                        Department = s.Organizations[0]?.Department,
                        Office = s.Organizations[0]?.Location,
                        Title = s.Organizations[0]?.Title,
                        Registered = s.CreationTimeRaw
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

        return users;
    }

    #region 

    #endregion
}
