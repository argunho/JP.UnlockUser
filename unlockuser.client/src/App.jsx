import { use, useEffect, useState } from "react";

// Installed
import { useLocation } from 'react-router-dom';

// Storage
import AuthContextProvider, { AuthContext } from "./storage/AuthContext";
import FetchContextProvider, { FetchContext } from "./storage/FetchContext"

// Components
import LinearLoading from "./components/LinearLoading";

// Routes
import AppRoutes from "./routes/AppRoutes";
import AuthRoutes from "./routes/AuthRoutes";

// Css
import './assets/css/custom.css';;

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

let isInitial = true;

function App() {
    return (
        <AuthContextProvider>
            <FetchContextProvider>
                <Root />
            </FetchContextProvider>
        </AuthContextProvider>
    );
}

function Root() {

    const [loading, setLoading] = useState(true);

    const { isAuthorized, authorize, logout} = use(AuthContext);
    const { resData, response, handleResponse, updateResData } = use(FetchContext);

    const loc = useLocation();


    useEffect(() => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!!token)
            authorize(token);
        else
            logout();

        setLoading(false);
    }, [isAuthorized])

    useEffect(() => {
        if (isInitial || (!response && !resData)) {
            isInitial = false;
            return;
        }

        if (resData)
            updateResData();
        if (response)
            handleResponse();
    }, [loc])

    if (loading)
        return <LinearLoading size={35} />;

    return (
        /* Routes */
        !isAuthorized ? <AppRoutes /> : <AuthRoutes isLocalhost={isLocalhost} />
    );
}

export default App;