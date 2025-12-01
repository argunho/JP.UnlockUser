import { use } from "react";

// Installed
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Storage
import AuthContextProvider, { AuthContext } from "./storage/AuthContext";
import DashboardProvider from './storage/DashboardContext';

// Routes
import OpenRoutes from "./routes/OpenRoutes";
import AppRoutes from "./routes/AppRoutes";

// Css
import './assets/css/index.css';
import './assets/css/modals.css';
import './assets/css/lists.css';
import './assets/css/animation.css';

function App() {
    return (
        <AuthContextProvider>
            <DashboardProvider>
                <Root />
            </DashboardProvider>
        </AuthContextProvider>
    );
}

function Root() {
    const { isAuthorized } = use(AuthContext);

    const routes = !isAuthorized ? OpenRoutes() : AppRoutes();
    const router = createBrowserRouter(routes);

    return <RouterProvider key={isAuthorized} router={router} />
}

export default App;