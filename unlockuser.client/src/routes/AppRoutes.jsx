// Installed
import { Navigate } from 'react-router-dom';

// Layouts
import AppLayout from '../layouts/AppLayout';
import SessionLayout from './../layouts/SessionLayout';
import ListLayout from '../layouts/ListLayout';
import UsersLayout from '../layouts/UsersLayout';
import MainLayout from './../layouts/MainLayout';

// Pages
import Employees from "../pages/auth/Employees";
import ClassManager from "../pages/auth/ClassManager";
import UserManager from "../pages/auth/UserManager";
import Members from "../pages/auth/Members";
import Home from "../pages/auth/Home";
import Catalog from "../pages/auth/Catalog";
import Logout, { signout } from "../pages/auth/Logout";
import ExpiredSession from '../pages/auth/ExpiredSession';
import Overview from './../pages/auth/Overview';
import Permissions from '../pages/auth/permissions';

import Contacts from "../pages/Contacts";
import NotFound from "../pages/NotFound";
import ErrorView from '../pages/ErrorView';

// Services
import { loader, loaderByApiParam, loaderById, loaderByParams } from '../services/LoadFunctions';

// Storage
import FetchContextProvider from '../storage/FetchContext';

// Css
import '../assets/css/form.css';
import '../assets/css/blocks.css';
import '../assets/css/modals.css';
import '../assets/css/lists.css';
import '../assets/css/manage.css';
import '../assets/css/message.css';

const AppRoutes = () => [
  {
    path: "/",
    element: <FetchContextProvider>
      <AppLayout />
    </FetchContextProvider>,
    errorElement: <NotFound isAuthorized={true} />,
    loader: loader("data/schools"),
    shouldRevalidate: () => false,
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
        path: "user/:id/load",
        element: <UserManager />,
        errorElement: <ErrorView />,
        loader: loaderByParams("user", ["group", "id"]),
        shouldRevalidate: () => false
      },
      {
        path: "school/:school/class/:classId",
        element: <ClassManager />,
        errorElement: <ErrorView />
      },
    ]
  },
  {
    path: "/view",
    element: <FetchContextProvider>
      <MainLayout />¨
    </FetchContextProvider>,
    errorElement: <NotFound isAuthorized={true} />,
    children: [
      {
        path: 'user/:id',
        element: <Overview />,
        errorElement: <ErrorView />
      },
      {
        path: 'user/by/:id',
        element: <Overview />,
        errorElement: <ErrorView />,
        loader: loaderById("user/by")
      },
      {
        path: 'my/permissions',
        element: <Permissions />,
        errorElement: <ErrorView />,
        loader: loader("user/permissions")
      }
    ]
  },
  {
    path: "/catalog",
    element: <FetchContextProvider>
      <ListLayout />¨
    </FetchContextProvider>,
    errorElement: <NotFound isAuthorized={true} />,
    children: [
      {
        path: 'logs/errors',
        element: <Catalog  label="Log filer"/>,
        errorElement: <ErrorView />,
        loader: loader("logs")
      },
      {
        path: 'logs/history',
        element: <Catalog  label="Log filer"/>,
        errorElement: <ErrorView />,
        loader: loader("/data/logs/history")
      },
      {
        path: 'statistics',
        element: <Catalog label="Statistik" fullWidth={true} />,
        errorElement: <ErrorView />,
        loader: loader("data/statistics")
      },
      {
        path: 'schools',
        element: <Catalog label="Skolor" id="id" fields={{ name: "", place: "" }} labels={["Namn", "Plats"]} />,
        errorElement: <ErrorView />,
        loader: loader("data/schools")
      },
    ]
  },
  {
    path: "/employees",
    element: <FetchContextProvider>
      <UsersLayout />¨
    </FetchContextProvider>,
    errorElement: <NotFound isAuthorized={true} />,
    loader: loader("employees/groups"),
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
        element: <Members />,
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