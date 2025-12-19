
import { createContext, useState } from "react";


// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext({
    isAuthorized: false,
    authorize: () => {},
    logout: () => {},
})

function AuthContextProvider({ children }) {

    const [authToken, setToken] = useState(localStorage.getItem("token") || sessionStorage.getItem("token"));

    function authorize(token) {
        sessionStorage.setItem("token", token);
        setToken(token);
    }

    function logout() {
        setToken(null);
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
    }

    const value = {
        isAuthorized: !!authToken,
        authorize: authorize,
        logout: logout
    }


    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;