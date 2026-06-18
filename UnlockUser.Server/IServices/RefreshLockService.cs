using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace UnlockUser.Server.IServices;

public class RefreshLockService : IRefreshLockService
{
    private readonly ConcurrentDictionary<string, TaskCompletionSource<bool>> _locks = new();

    public bool TryStart(string key, out Task waitTask)
    {
        var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);

        if (_locks.TryAdd(key, tcs))
        {
            // ты первый
            waitTask = Task.CompletedTask;
            return true;
        }

        // кто-то уже работает → даем task для ожидания
        waitTask = _locks[key].Task;
        return false;
    }

    public void Finish(string key)
    {
        if (_locks.TryRemove(key, out var tcs))
        {
            tcs.TrySetResult(true); // разблокируем всех ожидающих
        }
    }

}   
