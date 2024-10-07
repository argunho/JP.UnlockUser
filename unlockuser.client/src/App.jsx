import { useContext, useEffect, useState } from "react";

// Components 
import Header from "./components/Header";

// Functions
// import { DecodedToken } from "./functions/DecodedToken";

// Services
import AuthContextProvider, { AuthContext } from "./services/AuthContext";

// Storage

// Routes
import AppRoutes from "./routes/AppRoutes";
import AuthRoutes from "./routes/AuthRoutes";

// Css
import './assets/css/custom.css';
import { Container } from "@mui/material";

function App() {
    App.displayName = "App";

    return (
        <AuthContextProvider>
            <Root />
        </AuthContextProvider>
    );
}

function Root() {

    const [loading, setLoading] = useState(true);

    const authContext = useContext(AuthContext);

    useEffect(() => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!!token)
            authContext.authorize(token);
        else
            authContext.logout();

        setLoading(false);
    }, [authContext])

    if (loading)
        return null;

    return (
        <>
            <Header authContext={authContext} />
            <Container>
                {!authContext.isAuthorized ? <AppRoutes authContext={authContext} /> : <AuthRoutes authContext={authContext} />}
            </Container>
        </>
    );
}

export default App;