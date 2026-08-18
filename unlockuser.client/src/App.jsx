import { use, useMemo } from "react";

// Installed
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Storage
import AuthContextProvider, { AuthContext } from "./storage/AuthContext";

// Routes
import OpenRoutes from "./routes/OpenRoutes";
import AppRoutes from "./routes/AppRoutes";

// Css
import './assets/css/index.css';
import './assets/css/animation.css';

function App() {
    return (
        <AuthContextProvider>
                <Root />
        </AuthContextProvider>
    );
}

function Root() {
    const { isAuthorized } = use(AuthContext);

    const router = useMemo(() => {
        const routes = !isAuthorized ? OpenRoutes() : AppRoutes();
        return createBrowserRouter(routes);
    }, [isAuthorized]);

    return <RouterProvider key={isAuthorized} router={router} />
}

export default App;