namespace UnlockUser.Server.Interface;

public interface IRefreshLockService
{
    bool TryStart(string key, out Task waitTask);
    void Finish(string key);

}
