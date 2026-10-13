using Newtonsoft.Json;

namespace UnlockUser.Server.FormModels;

public class CaseStatusUpdateModel
{
    [JsonProperty("processingStatus")]
    public StatusModel? Status { get; set; }
}

public class StatusModel
{
    [JsonProperty("id")]
    public string? Id { get; set; }
}
