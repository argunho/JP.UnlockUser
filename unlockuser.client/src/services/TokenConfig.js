// Installed
import { jwtDecode } from 'jwt-decode';

export function TokenConfig(isForm) {

  // Jwt token to connect server
  const _token = localStorage.getItem("token") || sessionStorage.getItem("token");

  // Logout if token is expired
  const isExpired = IsTokenExpired(_token);

  if (isExpired) {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.pathname = "/session/logout";
  }

  const headers = isForm ? {} : {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*'
  }

  return ({
    headers: {
      'Authorization': `Bearer ${_token}`,
      ...headers
    }
  })
}

export function IsTokenExpired(jwtToken) {
  if (!jwtToken) return false;

  const { exp } = jwtDecode(jwtToken);
  if (!exp)
    return false; // "JWT does not contain exp claim"

  return Date.now() >= exp * 1000;
}