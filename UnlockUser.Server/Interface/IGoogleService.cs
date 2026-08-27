namespace UnlockUser.Server.Interface;

public interface IGoogleService
{
    Task<List<User>> GetStudentsFromGoogle();
    Task UpdatePaswords(List<UserFormModel> models);
    Task<List<Google.Apis.Admin.Directory.directory_v1.Data.User>> GetUsers();
}
