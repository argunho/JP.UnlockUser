
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

    useEffect(() => {
        document.title = "Utloggning";

        if (!expired)
            logout();
    }, [expired])

    async function logout() {
        // If the user is logged out, clear and remove all credential which was saved for the current session
        await ApiRequest("authentication/logout").then(res => {
            if (res.data?.errorMessage)
                console.error("Error response => " + res.data.errorMessage);
        }, error => {
            console.error("Error => " + error?.response)
        })
        authContext.logout();
        navigate("/");
    }

    if (!!expired)
        return <ExpiredSession navigate={navigate} />;

    return (
        <Loading msg="Du loggas ut" color="inherit" size={35} />
    )
}

export default Logout