using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;

namespace UnlockUser.Server.Services;

public partial class TopdeskService(IConfiguration config)
{
    private readonly string _baseURL = config["Topdesk:Url"]!;
    private readonly string _username = config["Topdesk:Username"]!;
    private readonly string _password = config["Topdesk:Password"]!; // 2026-09-24

    public async Task<Dictionary<string, object>?> SendData<T>(T? data, string api, HttpMethod? method = null) where T : class
    {
        ILogger _logger = new LoggerFactory().CreateLogger<TopdeskService>();
        try
        {
            using HttpClient client = new();
            method ??= HttpMethod.Post;

            var jsonModel = JsonConvert.SerializeObject(data, Formatting.Indented);
            var content = new StringContent(jsonModel, Encoding.UTF8);

            var uri = Path.Combine(_baseURL, api);
            using HttpRequestMessage httpRequest = new(method, uri);

            var credentials = Encoding.ASCII.GetBytes($"{_username}:{_password}");

            httpRequest.Headers.Authorization = new AuthenticationHeaderValue(
                "Basic",
                Convert.ToBase64String(credentials)
            );
            httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            httpRequest.Content = content;
            httpRequest.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            var response = await client.SendAsync(httpRequest);
            response.EnsureSuccessStatusCode();

            var responseBody = JsonConvert.DeserializeObject<Dictionary<string, object>>(await response.Content.ReadAsStringAsync());
            if (responseBody!.ContainsKey("data"))
            {
                return JsonConvert.DeserializeObject<Dictionary<string, object>>(responseBody["data"]?.ToString()!);
            }

            return null;
        }
        catch (Exception ex)
        {
            throw new Exception(ex.Message);
        }
    }

    public async Task<T?> GetData<T>(string api) where T : class
    {
        ILogger _logger = new LoggerFactory().CreateLogger<TopdeskService>();
        var client = new HttpClient();
        try
        {
            var uri = Path.Combine(_baseURL, api);
            using HttpRequestMessage httpRequest = new(HttpMethod.Get, uri);

            var response = await client.SendAsync(httpRequest);
            response.EnsureSuccessStatusCode();
            string responseBody = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<T>(responseBody) ?? null;
        }
        catch (Exception ex)
        {
            throw new Exception(ex.Message);
        }
    }
}
