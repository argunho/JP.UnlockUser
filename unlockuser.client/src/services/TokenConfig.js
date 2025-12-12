export function TokenConfig(isForm) {
  // Jwt token to connect server
  const _token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const headers = isForm ? {}  : {
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

// if (fetch)
//     return ({
//       'Authorization': `Bearer ${_token}`,
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Headers': '*'
//     })