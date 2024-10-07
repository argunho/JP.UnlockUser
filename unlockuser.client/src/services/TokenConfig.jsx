export function TokenConfig(fetch = false) {
    // Jwt token to connect server
    const _token = localStorage.getItem("token") || sessionStorage.getItem("token");
  
    if (fetch)
      return ({
        'Authorization': `Bearer ${_token}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      })
      
    return ({
      headers: {
        'Authorization': `Bearer ${_token}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      }
    })
  }