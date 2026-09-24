using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;

namespace UnlockUser.Server.Services;

public partial class TopdeskService
{
    private static readonly string _baseURL = "https://alvesta.topdesk.net/tas/api/";
    private static readonly string _username = "api_servicedesk";
    private static readonly string _password = Environment.GetEnvironmentVariable("TopdeskPassword") ?? ""; // 2026-09-24

    public static async Task<Dictionary<string, object>?> SendData<T>(T? data, string api, HttpMethod? method = null) where T : class
    {
        ILogger _logger = new LoggerFactory().CreateLogger<TopdeskService>();
        try
        {
            using HttpClient client = new();
            method ??= HttpMethod.Post;
            //var jsonModel = System.Text.Json.JsonSerializer.Serialize(data);
            var jsonModel = JsonConvert.SerializeObject(data, Formatting.Indented);
            var content = new StringContent(jsonModel, Encoding.UTF8);

            var uri = Path.Combine(_baseURL, api);
            using HttpRequestMessage httpRequest = new(method, uri);
            // set basic auth header via encoded credentials below
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

    public static async Task<T?> GetData<T>(string api) where T : class
    {

        ILogger _logger = new LoggerFactory().CreateLogger<TopdeskService>();
        var client = new HttpClient();
        try
        {
            var uri = Path.Combine(_baseURL, api);
            using HttpRequestMessage httpRequest = new(HttpMethod.Get, uri);
            // helper left in place: use explicit basic auth below; remove invalid type usage
            var response = await client.SendAsync(httpRequest);
            response.EnsureSuccessStatusCode();
            string responseBody = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<T>(responseBody) ?? null;
        }
        catch (Exception ex)
        {
            //_logger.LogInformation("Something went wrong. Error: => {0}. Function: {1}", ex.Message, nameof(GetData));
            throw new Exception(ex.Message);
        }
    }

    public static async Task<Dictionary<string, object>?> GetUsingToken(string? token, string? url)
    {
        ILogger _logger = new LoggerFactory().CreateLogger<TopdeskService>();
        try
        {
            if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(token))
                return null;

            var client = new HttpClient();
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("Authorization", $"Bearer {token}");
            var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode();
            var responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<Dictionary<string, object>>(responseData);

        }
        catch (Exception ex)
        {
            //_logger.LogInformation("Something went wrong. Error: => {0}. Function: {1}", ex.Message, nameof(GetUsingToken));
            throw new Exception(ex.Message);
        }
    }

    public static async Task<bool> InvokeHttpFunction(string url)
    {
        ILogger _logger = new LoggerFactory().CreateLogger<TopdeskService>();
        try
        {
            var client = new HttpClient();
            var request = new HttpRequestMessage(HttpMethod.Get, $"http://localhost:7252/api/{url}");
            request.Headers.Add("x-functions-key", Environment.GetEnvironmentVariable("TOPDESK_FUNCTION_KEY") ?? ""); // 2026-09-24
            var content = new StringContent("", null, "text/plain");
            request.Content = content;
            var response = await client.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            //_logger.LogInformation("Something went wrong. Error: => {0}. Function: {1}", ex.Message, nameof(GetUsingToken));
            throw new Exception(ex.Message);
        }
    }
}
