import { useEffect, use } from "react";

// Components
import Loading from "../../components/blocks/Loading";

// Services
import { ApiRequest } from "../../services/ApiRequest";

// Storage
import { AuthContext } from "../../storage/AuthContext";

// eslint-disable-next-line react-refresh/only-export-components
export async function signout() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    await ApiRequest("api/authentication/logout/" + token, "delete");
}

function Logout() {

    const { logout } = use(AuthContext);

    useEffect(() => {
        document.title = "UnlockUser | Utloggning";

        const timer = setTimeout(() => {
            logout();
            window.location.href = "/";
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