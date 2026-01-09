// Installed
import { Navigate } from 'react-router-dom';

// Layouts
import AppLayout from '../layouts/AppLayout';
import SessionLayout from './../layouts/SessionLayout';
import UsersLayout from './../layouts/UsersLayout';

// Pages
import Employees from "../pages/auth/Employees";
import ClassManager from "../pages/auth/ClassManager";
import UserManager from "../pages/auth/UserManager";
import Home from "../pages/auth/Home";
import Catalog from "../pages/auth/Catalog";
import Logout, { signout } from "../pages/auth/Logout";
import ExpiredSession from '../pages/auth/ExpiredSession';
import Overview from './../pages/auth/Overview';
import Permissions from '../pages/auth/permissions';
import EmployeeView from '../pages/auth/EmployeeView';

import Contacts from "../pages/Contacts";
import NotFound from "../pages/NotFound";
import ErrorView from '../pages/ErrorView';

// Services
import { loader, loaderById, loaderByParams } from '../services/LoadFunctions';

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
      },
      {
        path: "manage/:group",
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
          }
        ]
      },
      {
        path: "/view",
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
          },
        ]
      },
      {
        path: "/catalog",
        children: [
          {
            path: ':api/errors',
            element: <Catalog label="Loggfiler" search={true} download="logs/download/by" />,
            errorElement: <ErrorView />,
            loader: loader("logs")
          },
          {
            path: ':api/history',
            element: <Catalog label="Historik" api="data/history" search={true} download="data/download/by" modal={true} />,
            errorElement: <ErrorView />,
            loader: loader("data/logs/history")
          },
          {
            path: 'statistics',
            element: <Catalog label="Statistik" fullWidth={true} dropdown={true} />,
            errorElement: <ErrorView />,
            loader: loader("data/statistics")
          },
          {
            path: 'schools',
            element: <Catalog label="Skolor" api="data/school" fields="school" />,
            errorElement: <ErrorView />,
            loader: loader("data/schools")
          },
        ]
      },
      {
        path: "/moderators",
        element: <UsersLayout />,
        errorElement: <NotFound isAuthorized={true} />,
        loader: loader("user/principal"),
        // shouldRevalidate: () => false,
        children: [
          {
            index: true,
            element: <Navigate to="/moderators/personal" replace />,
            errorElement: <ErrorView />
          },
          {
            path: ":group",
            element: <Employees />,
            errorElement: <ErrorView />
          },
          {
            path: "view/:id",
            element: <EmployeeView />,
            errorElement: <ErrorView />
          }
        ]
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