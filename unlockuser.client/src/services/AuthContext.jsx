import { createContext, useState } from "react";

export const AuthContext = createContext({
    isAuthorized: false,
    isOpenMenu: false,
    workInProgress: false,
    workStatus: false,
    authorize: (token) => { },
    logout: () => { },
    handleMenu: () => { },
    updateServiceWorkStatus: (value, hide = false) => { }
})

function AuthContextProvider({ children }) {

    const [authToken, setToken] = useState(null);
    const [openMenu, setOpenMenu] = useState(false);
    const [serviceWorkStatus, setServiceWorkStatus] = useState(false);
    const [serviceWorkInProgress, setServiceWorkInProgress] = useState(false);

    function authorize(token) {
        sessionStorage.setItem("token", token);
        setToken(token);
    }

    function logout() {
        setToken(null);
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
    }

    function handleMenu() {
        setOpenMenu(!openMenu);
    }

    function updateServiceWorkStatus(value, hide = false) {
        setServiceWorkInProgress(hide ? value : false);
        setServiceWorkStatus(hide ? false : value);
    }
    
    const value = {
        isAuthorized: !!authToken,
        isOpenMenu: openMenu,
        workInProgress: serviceWorkInProgress,
        workStatus: serviceWorkStatus,
        authorize: authorize,
        logout: logout,
        handleMenu: handleMenu,
        updateServiceWorkStatus: updateServiceWorkStatus
    }


    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;