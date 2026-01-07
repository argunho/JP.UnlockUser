export function SessionData(item) {
  const session = sessionStorage.getItem(item);

  return !!session ? JSON.parse(session) : [];
}

export const IsLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  // [::1] is the IPv6 localhost address.
  window.location.hostname === '[::1]' ||
  // 127.0.0.0/8 are considered localhost for IPv4.
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function DownloadFile(blob, name) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  a.download = name;
  a.click();

  window.URL.revokeObjectURL(url);
} 

// filename from server
  // const fileName = response.headers["content-disposition"]
  //     ?.split("filename=")[1]
  //     ?.replace(/"/g, "") || "file.pdf";