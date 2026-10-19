//Layout 
import OpenLayout from "../layouts/OpenLayout";

// Pages
import Login from "../pages/open/Login";
import Contacts from "../pages/Contacts";
import NotFound from '../pages/NotFound';
import ErrorView from "../pages/ErrorView";

// Storage
import FetchContextProvider from "../storage/FetchContext";
import { loaderById } from "../services/LoadFunctions";

const OpenRoutes = () => [
  {
    path: "/",
    element: <FetchContextProvider>
      <OpenLayout />
    </FetchContextProvider>,
    errorElement: <NotFound/>,
    children: [
      {
        index: true,
        element: <Login />,
        errorElement: <ErrorView />
      },
      {
        path: "login",
        element: <Login />,
        errorElement: <ErrorView />
      },
      {
        path: "login/develop/mode/:id", // 2026-10-19
        element: <Login />,
        errorElement: <ErrorView />,
        loader: loaderById("catalog/develop/mode")
      },
      {
        path: "contacts",
        element: <Contacts />,
        errorElement: <ErrorView />
      }
    ]
  }
];

export default OpenRoutes;