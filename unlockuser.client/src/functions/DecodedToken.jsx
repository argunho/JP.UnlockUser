import { jwtDecode } from "jwt-decode";

export function DecodedToken(token) {

    if(!token) 
        token = localStorage.getItem("token") ?? sessionStorage.getItem("token");

    if(!token)
        return null;

    // Jwt token to connect server
    return jwtDecode(token);
}