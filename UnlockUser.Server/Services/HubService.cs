using Microsoft.AspNetCore.SignalR;


namespace Onboarding.Server.Services;

public sealed class HubService() : Hub
{
    //private readonly IDictionary<string, UserConnection> _connection = connection;
    //IDictionary<string, UserConnection> connection,

    public async Task JoinConnection(UserConnection model)
    {
        try
        {
            //var userConnection = new UserConnection
            //{
            //    Connection = model.Connection,
            //    Email = model.Email
            //};

            await Groups.AddToGroupAsync(Context.ConnectionId, model?.Connection);
            //_connection[Context.ConnectionId] = userConnection;

            await Clients.Group(model.Connection).SendAsync("ConnectionMessage", model, $"Connected to => {model.Connection}");
        }
        catch (Exception ex)
        {

        }
    }

    public async Task CloseConnection() =>
        await OnDisconnectedAsync(null);

    public override Task OnConnectedAsync() => 
        base.OnConnectedAsync();

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        //if (_connection.TryGetValue(Context.ConnectionId, out UserConnection? connection))
        //    _connection.Remove(Context.ConnectionId);
        Task.Run(async () =>
        {
            await Clients.Group("onboarding").SendAsync("ConnectionMessage", "onboarding", $"Disconnected to onboarding");
        });
        return base.OnDisconnectedAsync(exception);
    }
}
