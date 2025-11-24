
import { createContext, useState } from "react";

/* eslint-disable no-unused-vars */
export const AuthContext = createContext({
    isAuthorized: false,
    workInProgress: false,
    workStatus: false,
    authorize: () => {},
    logout: () => {},
    updateServiceWorkStatus: (value, hide = false) => { },
    cleanSession: () => { }
})

function AuthContextProvider({ children }) {

    const [authToken, setToken] = useState(localStorage.getItem("token") || sessionStorage.getItem("token"));
    const [openMenu, setOpenMenu] = useState(false);
    const [serviceWorkStatus, setServiceWorkStatus] = useState(false);
    const [serviceWorkInProgress, setServiceWorkInProgress] = useState(false);

    function authorize(token) {
        setToken(token);
    }

    function logout() {
        setToken(null);
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("schools");
        cleanSession();
    }

    function cleanSession() {
        sessionStorage.removeItem("users");
        sessionStorage.removeItem("sOption")
    }

    function updateServiceWorkStatus(value, hide = false) {
        setServiceWorkInProgress(hide ? value : false);
        setServiceWorkStatus(hide ? false : value);
    }

    const value = {
        isAuthorized: !!authToken,
        workInProgress: serviceWorkInProgress,
        workStatus: serviceWorkStatus,
        authorize: authorize,
        logout: logout,
        updateServiceWorkStatus: updateServiceWorkStatus,
        cleanSession: cleanSession
    }


    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;