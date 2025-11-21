// Layouts
import AppLayout from '../Layouts/AppLayout';
import SessionLayout from './../layouts/SessionLayout';
import ListLayout from '../layouts/ListLayout';

// Pages
import EmployeesList from "../pages/auth/EmployeesList";
import ClassManager from "../pages/auth/ClassManager";
import LogFiles from "../pages/auth/LogFiles";
import UserManager from "../pages/auth/UserManager";
import Members from "../pages/auth/Members";
import Home from "../pages/auth/Home";
import ListView from "../pages/auth/ListView";
import Logout, { signout } from "../pages/auth/Logout";
import Contacts from "../pages/Contacts";
import NotFound from "../pages/NotFound";
import ErrorView from '../pages/ErrorView';

// Function 
import SessionData from "../functions/SessionData";
// import { loader, loaderByApiParam, loaderById, loaderCheck } from '../functions/LoadFunctions';

// Storage
import FetchContextProvider from '../storage/FetchContext';

// Css
// import 'bootstrap/dist/css/bootstrap.css';
import '../assets/css/form.css';
import '../assets/css/blocks.css';
import ExpiredSession from '../pages/auth/ExpiredSession';


const AppRoutes = () => [
  {
    path: "/",
    element: <FetchContextProvider>
      <AppLayout />
    </FetchContextProvider>,
    errorElement: <NotFound isAuthorized={true} />,
    children: [
      {
        index: true,
        element: <Home />,
        errorElement: <ErrorView />
      },
      {
        path: "home",
        element: <Home />,
        errorElement: <ErrorView />
      },
      {
        path: 'contact',
        element: <Contacts isAuthorized={true} />
      }
    ]
  },
  {
    path: "/manage",
    element: <FetchContextProvider>
      <AppLayout />
    </FetchContextProvider>,
    errorElement: <NotFound isAuthorized={true} />,
    children: [
      {
        path: "user/:id",
        element: <UserManager />,
        errorElement: <ErrorView />
      },
      {
        path: "class/:id/:school",
        element: <ClassManager />,
        errorElement: <ErrorView />
      },
    ]
  },
  {
    path: "/list",
    element: <FetchContextProvider>
      <ListLayout />¨
    </FetchContextProvider>,
    errorElement: <NotFound isAuthorized={true} />,
    children: [
      {
        path: 'logs/:param',
        element: <LogFiles />,
        errorElement: <ErrorView />
      },
      {
        path: 'session/history',
        element: <ListView includedList={SessionData("sessionWork")} label="Session historia" fullWidth={true} />,
        errorElement: <ErrorView />
      },
      {
        path: 'statistics',
        element: <ListView label="Statistik" api="data/statistics" fullWidth={true} />,
        errorElement: <ErrorView />
      },
      {
        path: 'schools',
        element: <ListView label="Skolor" api="data/schools" id="id" fields={{ name: "", place: "" }} labels={["Namn", "Plats"]} />,
        errorElement: <ErrorView />
      },
      {
        path: "employees",
        element: <EmployeesList />
      },
      {
        path: "employees/:groupName",
        element: <EmployeesList />
      },
      {
        path: 'members/:office/:department',
        element: <Members />,
      },
    ]
  },
  {
    path: "/session",
    element: <FetchContextProvider>
      <SessionLayout />
    </FetchContextProvider>,
    errorElement: <NotFound isAuthorized={true} />,
    children: [
      {
        path: "expired",
        element: <ExpiredSession />,
        errorElement: <ErrorView />
      },
      {
        path: "logout",
        element: <Logout />,
        errorElement: <ErrorView />,
        loader: signout
      }
    ]
  }
];

export default AppRoutes;