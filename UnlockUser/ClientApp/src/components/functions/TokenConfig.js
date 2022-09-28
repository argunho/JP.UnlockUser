export default function TokenConfig() {
  // Jwt token to connect server
  const _token = sessionStorage.getItem("token");

  return ({
    headers: { 'Authorization': `Bearer ${_token}` }
  })
}
