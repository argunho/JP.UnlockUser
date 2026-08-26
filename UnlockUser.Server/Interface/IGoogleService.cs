namespace UnlockUser.Server.Interface;

public interface IGoogleService
{
    Task<List<User>> GetStudentsFromGoogle();
}
