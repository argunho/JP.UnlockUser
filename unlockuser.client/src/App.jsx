import { use } from "react";

// Installed
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Services
import AuthContextProvider, { AuthContext } from "./storage/AuthContext";

// Routes
import OpenRoutes from "./routes/OpenRoutes";
import AppRoutes from "./routes/AppRoutes";

// Css
import './assets/css/index.css';
import './assets/css/modals.css';
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

    const routes = !isAuthorized ? OpenRoutes() : AppRoutes();
    const router = createBrowserRouter(routes);

    return <RouterProvider key={isAuthorized} router={router} />
}

export default App;