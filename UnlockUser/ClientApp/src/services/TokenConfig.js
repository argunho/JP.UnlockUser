function TokenConfig(tokenCheck = false) {
    // Jwt token to connect server
    const token = sessionStorage.getItem("token");

    if (tokenCheck)
        return (token !== null && token !== undefined);

    return ({
        headers: { 'Authorization': `Bearer ${token}` }
    })
}

export default TokenConfig;