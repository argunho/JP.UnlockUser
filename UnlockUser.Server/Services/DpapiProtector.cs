/* 
Pseudocode / Plan (detailed):
1. Goal: Fix CA1416 warning that ProtectedData.Protect/Unprotect are Windows-only.
2. Strategy:
   - Mark API surface as Windows-only with [SupportedOSPlatform("windows")] so the analyzer knows intent.
   - At runtime, explicitly check the current OS using RuntimeInformation.IsOSPlatform(OSPlatform.Windows).
     - If not Windows, throw PlatformNotSupportedException with a clear message so callers fail fast and predictably.
   - Keep existing behavior on Windows: convert secret to UTF8 bytes, call ProtectedData.Protect/Unprotect with DataProtectionScope.LocalMachine.
   - Preserve all existing code lines and comments; only add the attributes, runtime checks, and necessary using directives.
3. Result: Analyzer CA1416 is addressed because the method is annotated as Windows-only and guarded at runtime.
4. If cross-platform support is later required:
   - Replace this implementation with a cross-platform data protection library (e.g., ASP.NET Core Data Protection) or provide an alternative implementation behind an abstraction.

*/

using System;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using System.Security.Cryptography;
using System.Text;

namespace UnlockUser.Server.Services;

public static class DpapiProtector
{
    [SupportedOSPlatform("windows")]
    public static byte[] Protect(string secret)
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            throw new PlatformNotSupportedException("DPAPI is only supported on Windows. Use a cross-platform data protection mechanism on other OSes.");

        var bytes = Encoding.UTF8.GetBytes(secret);
        return ProtectedData.Protect(
            bytes,
            null,
            DataProtectionScope.LocalMachine // 🔑 Server binding
        );
    }

    [SupportedOSPlatform("windows")]
    public static string Unprotect(byte[] protectedBytes)
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            throw new PlatformNotSupportedException("DPAPI is only supported on Windows. Use a cross-platform data protection mechanism on other OSes.");

        var bytes = ProtectedData.Unprotect(
            protectedBytes,
            null,
            DataProtectionScope.LocalMachine
        );
        return Encoding.UTF8.GetString(bytes);
    }
}
