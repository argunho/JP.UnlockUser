
import { createContext, useState } from "react";
/* eslint-disable no-unused-vars */
export const AuthContext = createContext({
    isAuthorized: false,
    isOpenMenu: false,
    workInProgress: false,
    workStatus: false,
    group: "",
    groups: [],
    schools: [],
    authorize: (token) => { },
    logout: () => { },
    handleMenu: () => { },
    updateServiceWorkStatus: (value, hide = false) => { },
    updateGroupName: (value) => { },
    updateSchools: (value) => { },
    cleanSession: () => {}
})

function AuthContextProvider({ children }) {

    const [authToken, setToken] = useState(null);
    const [openMenu, setOpenMenu] = useState(false);
    const [serviceWorkStatus, setServiceWorkStatus] = useState(false);
    const [serviceWorkInProgress, setServiceWorkInProgress] = useState(false);
    const [groupName, setGroupName] = useState(sessionStorage.getItem("group"));
    const [schoolsList, setSchoolsList] = useState([]);

    function authorize(token) {
        sessionStorage.setItem("token", token);
        setToken(token);
    }

    function logout() {
        setToken(null);
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("group");
        sessionStorage.removeItem("groups");
        sessionStorage.removeItem("schools");
        cleanSession();
    }

    function cleanSession(){
        sessionStorage.removeItem("users");
        sessionStorage.removeItem("sOption")
    }

    function handleMenu() {
        setOpenMenu(!openMenu);
    }

    function updateServiceWorkStatus(value, hide = false) {
        setServiceWorkInProgress(hide ? value : false);
        setServiceWorkStatus(hide ? false : value);
    }

    function updateGroupName(value) {
        setGroupName(value);
    }

    function updateSchools(value) {
        setSchoolsList(value);
        sessionStorage.setItem("schools", JSON.stringify(value));
    }

    const value = {
        isAuthorized: !!authToken,
        isOpenMenu: openMenu,
        workInProgress: serviceWorkInProgress,
        workStatus: serviceWorkStatus,
        group: groupName,
        groups: JSON.parse(sessionStorage.getItem("groups")),
        schools: schoolsList,
        authorize: authorize,
        logout: logout,
        handleMenu: handleMenu,
        updateServiceWorkStatus: updateServiceWorkStatus,
        updateGroupName: updateGroupName,
        updateSchools: updateSchools,
        cleanSession: cleanSession
    }


    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;