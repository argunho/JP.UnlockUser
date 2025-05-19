
import { useEffect, use } from "react";

// Components
import Loading from "../../components/Loading";

// Fucntions
import { ErrorHandle } from "../../functions/ErrorHandle";

// Storage
import { FetchContext } from './../../storage/FetchContext';
import { AuthContext } from "../../storage/AuthContext";

function Logout() {

    const { logout } = use(AuthContext);
    const { reqFetchFn } = use(FetchContext);

    useEffect(() => {
        document.title = "UnlockUser | Utloggning";

        const token = localStorage.getItem("token") || sessionStorage.getItem("token");

        async function signout() {
            try {
                await reqFetchFn("authentication/logout/" + token, "delete");
                setTimeout(() => {
                    logout();
                }, 1500);
            } catch (error) {
                logout();
                ErrorHandle(error);
            }
        }

        signout();
    }, [])

    return (
        <Loading msg="Du loggas ut" size={35} />
    )
}

export default Logout;