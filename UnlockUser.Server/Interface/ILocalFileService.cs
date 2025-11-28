namespace UnlockUser.Server.Interface;

public interface ILocalFileService
{
    List<T> GetListFromFile<T>(string fileName) where T : class;
    byte[] EncryptStringToBytes(string plainText);
    string DecryptStringFromBytes(byte[] cypherText);
}
