using Newtonsoft.Json;

namespace UnlockUser.Server.Models;

public class IncidentCase
{
    [JsonProperty("caller")]
    public Caller? Caller { get; set; }

    [JsonProperty("briefDescription")]
    public string? Description { get; set; }

    [JsonProperty("request")]
    public string? Request { get; set; }

    [JsonProperty("targetDate")]
    public string? TargetDate { get; set; }

    [JsonProperty("operatorGroup")]
    public Operator? OperatorGroup { get; set; } = new();

    [JsonProperty("callType")]
    public CallType? CallType { get; set; } = new();

    [JsonProperty("category")]
    public Category? Category { get; set; } = new();

    [JsonProperty("subcategory")]
    public Subcategory? Subcategory { get; set; } = new();

    [JsonProperty("entryType")]
    public EntryType? EntryType { get; set; } = new();

    [JsonProperty("impact")]
    public Impact? Impact { get; set; } = new();

    [JsonProperty("urgency")]
    public Urgency? Urgency { get; set; } = new();

    [JsonProperty("processingStatus")]
    public Status? Status { get; set; } = new();
}

public class Caller
{

    [JsonProperty("email")]
    public string? Email { get; set; }

    [JsonProperty("dynamicName")]
    public string? DynamicName { get; set; }

    [JsonProperty("branch")]
    public Branch? Branch { get; set; } = new();
}

public class Branch
{

    [JsonProperty("id")]
    public string Id { get; set; } = "c583a99d-65c5-47b2-9a82-f04509ddc7c4"; // Alvesta kommun
    //public string name { get; set; } = "Alvesta Kommun";
}

public class Operator
{
    [JsonProperty("id")]
    public string Id { get; set; } = "58bb7586-92e1-4396-81aa-8823cdc0235b"; // Servicedesk
}

public class CallType
{

    [JsonProperty("id")]
    //public string Id { get; set; } = "82de22cf-7537-40c8-af3a-e3134e9ae414"; // Order
    //public string Id { get; set; } = "3b4e1c80-be3b-5b35-b6f2-5330a9acdb64"; // Incident
    public string Id { get; set; } = "b46bd95d-1b4b-5667-bf6a-86531696c8cc"; // Begäran

}

public class EntryType
{

    [JsonProperty("id")]
    //public string Id { get; set; } = "a7bea2c6-0951-421f-8ee1-9d4095b1ec89"; // Telefon
    public string Id { get; set; } = "70ac2b1d-e430-4f54-848d-391a4c1dfef2"; // E-tjänst
}

public class Category
{

    [JsonProperty("id")]
    //public string Id { get; set; } = "86411a1a-adb9-4bbf-ad81-9fbc946f8305"; // "Digital arbetsplats"
    public string Id { get; set; } = "c8322080-94f2-4911-9b4d-527f7d2e7cac"; // "Autentisering"
}

public class Subcategory
{

    [JsonProperty("id")]
    public string Id { get; set; } = "29cbd0c2-8976-4d0a-a17a-7974ad68e722"; // "Nytt"
}

public class Impact
{

    [JsonProperty("id")]
    public string Id { get; set; } = "6dd9cf42-0529-52bc-bbee-87872646ac71"; // "Låg - en eller fåtal personer påverkas"
}

public class Urgency
{

    [JsonProperty("id")]
    public string Id { get; set; } = "6e007112-e0c4-4b23-b4b7-2f22bcf80895"; // "Medium - Kan arbeta med annat men behöver en lösning"
}

public class Status
{
    [JsonProperty("id")]
    //public string Id { get; set; } = "0ee72955-075d-4af7-b02d-5e52e3683164"; // Pågående
    public string Id { get; set; } = "325ded26-849e-4c9f-94c3-0114ebf7e891"; // Registrerad
}