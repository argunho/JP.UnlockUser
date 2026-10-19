import { useEffect, use } from "react";

// Installed
import { useLoaderData } from 'react-router-dom';

// Components
import Loading from "../../components/blocks/Loading";

// Services
import { ApiRequest } from "../../services/ApiRequest";

// Storage
import { AuthContext } from "../../storage/AuthContext";

// eslint-disable-next-line react-refresh/only-export-components
export function signout(api = "logout") { // 2026-10-19 - not async: the route needs the inner function, not a Promise of it
    return async function () {
        return await ApiRequest(`authentication/${api}`, "delete");
    }
}

function Logout() {

    const { logout } = use(AuthContext);
    const link = useLoaderData();

    useEffect(() => {
        document.title = "UnlockUser | Utloggning";

        const timer = setTimeout(() => {
            logout();
            window.location.href = typeof link === "string" && link.startsWith("login/develop/mode/") ? `/${link}` : "/";
        }, 1500);

        return () => {
            clearTimeout(timer);
        }
    }, [])

    return (
        <Loading msg="Du loggas ut" color="inherit" size={35} cls="curtain" />
    )
}

export default Logout;