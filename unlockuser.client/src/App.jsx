import { useContext, useEffect } from "react";

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
    const authContext = useContext(AuthContext);

    useEffect(() => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!!token)
            authContext.authorize(token);
        else
            authContext.logout();
    }, [authContext])

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