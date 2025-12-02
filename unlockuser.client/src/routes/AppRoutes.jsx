// Installed
import { Navigate } from 'react-router-dom';

// Layouts
import AppLayout from '../layouts/AppLayout';
import SessionLayout from './../layouts/SessionLayout';
import ListLayout from '../layouts/ListLayout';
import UsersLayout from '../layouts/UsersLayout';
import AccountManagementLayout from '../layouts/AccountManagementLayout';

// Pages
import Employees from "../pages/auth/Employees";
import ClassManager from "../pages/auth/ClassManager";
import LogFiles from "../pages/auth/LogFiles";
import UserManager from "../pages/auth/UserManager";
import ClassStudents from "../pages/auth/ClassStudents";
import Home from "../pages/auth/Home";
import ListView from "../pages/auth/ListView";
import Logout, { signout } from "../pages/auth/Logout";
import ExpiredSession from '../pages/auth/ExpiredSession';

import Contacts from "../pages/Contacts";
import NotFound from "../pages/NotFound";
import ErrorView from '../pages/ErrorView';

// Function 
import SessionData from "../functions/SessionData";

// Services
import { loader, loaderByApiParam, loaderById } from '../services/LoadFunctions';

// Storage
import FetchContextProvider from '../storage/FetchContext';

// Css
import '../assets/css/form.css';
import '../assets/css/blocks.css';
import '../assets/css/modals.css';
import '../assets/css/lists.css';

const AppRoutes = () => [
  {
    path: "/",
    element: <FetchContextProvider>
      <AppLayout />
    </FetchContextProvider>,
    errorElement: <NotFound isAuthorized={true} />,
    loader: loader("data/schools"),
    children: [
      {
        index: true,
        element: <Navigate to="/search" replace />,
        errorElement: <ErrorView />
      },
      {
        path: "home",
        element: <Navigate to="/search" replace />,
        errorElement: <ErrorView />
      },
      {
        path: "search",
        element: <Home />,
        errorElement: <ErrorView />
      },
      {
        path: "search/:group",
        element: <Home />,
        errorElement: <ErrorView />
        // loader: loaderByParams("search", "group")
      },
      {
        path: 'contact',
        element: <Contacts isAuthorized={true} />
      }
    ]
  },
  {
    path: "/manage/:group",
    element: <FetchContextProvider>
      <AccountManagementLayout />
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
    ]
  },
  {
    path: "/employees",
    element: <FetchContextProvider>
      <UsersLayout />¨
    </FetchContextProvider>,
    errorElement: <NotFound isAuthorized={true} />,
    loader: loader("app/groups"),
    children: [
      {
        index: true,
        element: <Employees />,
        errorElement: <ErrorView />
      },
      {
        path: ":id",
        element: <Employees />,
        errorElement: <ErrorView />,
        loader: loaderById("employees")
      },
      {
        path: ':office/:department',
        element: <ClassStudents />,
        errorElement: <ErrorView />,
        loader: loaderByApiParam("search/members", ["department", "office"])
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