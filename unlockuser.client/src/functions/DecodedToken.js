import { jwtDecode } from "jwt-decode";

export function DecodedToken(token = null) {

    if (!token)
        token = localStorage.getItem("token") ?? sessionStorage.getItem("token");

    if (!token)
        return null;

    // Jwt token to connect server
    return jwtDecode(token);
}

export function DecodedClaims(token = null) {
    var decodedToken = DecodedToken(token);
    return decodedToken ? Object.fromEntries(
        Object.entries(decodedToken).map(([key, value]) => {
            key = key[0].toLowerCase() + key.slice(1);
            return [key, value]
        })
    ) : null;
}

export function Claim(name) {
    var claim = DecodedClaims()?.[name];
    try {
        var claimData = JSON.parse(claim);
        if (Array.isArray(claimData)) {
            return claimData.map(item => Object.fromEntries(
                Object.entries(item).map(([key, value]) => [key.toLowerCase(), value]))
            );
        } else {
            return Object.fromEntries(
                Object.entries(claimData).map(([key, value]) => [key.toLowerCase(), value])
            );
        }
    } catch {
        return claim;
    }
} 