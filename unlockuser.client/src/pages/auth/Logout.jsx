
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Installed

// Components
import Loading from "../../components/Loading";
import ExpiredSession from "../../components/ExpiredSession";

// Services
import ApiRequest from "../../services/ApiRequest";
import { AuthContext } from "../../services/AuthContext";

function Logout({ expired }) {
    Logout.displayName = "Logout";

    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    useEffect(() => {
        document.title = "Utloggning";

        if (!expired)
            logout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expired])

    async function logout() {
        await ApiRequest("authentication/logout/" + token).then(res => {
            if (res.data)
                authContext.logout();
        })
    }

    if (!!expired)
        return <ExpiredSession navigate={navigate} />;

    return (
        <Loading msg="Du loggas ut" color="inherit" size={35} />
    )
}

export default Logout