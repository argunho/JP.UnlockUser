using GoogleUserModel = Google.Apis.Admin.Directory.directory_v1.Data.User;

namespace UnlockUser.Server.Interface;

public interface IGoogleService
{
    Task<List<User>> GetStudentsFromGoogle();
    Task UpdatePaswords(List<UserFormModel> models);
    Task<List<GoogleUserModel>> GetUsers();
    Task<GoogleUserModel?> GetUser(string email);
}
