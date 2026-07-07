// Installed
import { Navigate } from 'react-router-dom';

// Layouts
import AppLayout from '../layouts/AppLayout';
import SessionLayout from './../layouts/SessionLayout';
import UsersLayout from './../layouts/UsersLayout';
import CatalogLayout from '../layouts/CatalogLayout';

// Pages
import Employees from "../pages/auth/Employees";
import ClassManager from "../pages/auth/ClassManager";
import UserManager from "../pages/auth/UserManager";
import Home from "../pages/auth/Home";
import Catalog from "../pages/auth/Catalog";
import Manual from "../pages/auth/Manual";
import FormManual from "../pages/auth/FormManual";
import Logout, { signout } from "../pages/auth/Logout";
import ExpiredSession from '../pages/auth/ExpiredSession';
import Overview from './../pages/auth/Overview';
import Permissions from '../pages/auth/permissions';
import EmployeeView from '../pages/auth/EmployeeView';

import Contacts from "../pages/Contacts";
import NotFound from "../pages/NotFound";
import ErrorView from '../pages/ErrorView';

// Services
import { loader, loaderById, loaderByParams, loaderBySession } from '../services/LoadFunctions';

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
    loader: loaderBySession("article/popup/message", "popup", true),
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
        path: "search/support/view/user/:id",
        element: <Overview />,
        errorElement: <ErrorView />,
        loader: loaderById("user/by")
      },
      {
        path: "manual",
        children: [
          {
            index: true,
            element: <Manual api="manual" label="Webbapp-manual" menuLabel="Kunskapsartiklar" />,
            errorElement: <ErrorView />,
            loader: loader("manual")
          },
          {
            path: "new",
            element: <FormManual api="manual" label="Nya manual" />
          },
          {
            path: "edit/:id",
            element: <FormManual api="manual" />
          }
        ]
      },
      {
        path: "articles",
        children: [
          {
            index: true,
            element: <Manual api="articles" label="Information" menuLabel="Aritiklar" checkbox={true} />,
            errorElement: <ErrorView />,
            loader: loader("articles")
          },
          {
            path: "new",
            element: <FormManual api="articles" label="Nya artikel" checkbox="popup" />
          },
          {
            path: "edit/:id",
            element: <FormManual api="articles" checkbox="popup" />
          }
        ]
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
            errorElement: <ErrorView />,
            loader: loaderByParams("user/by", ["group", "id"]),
            // shouldRevalidate: () => false
          },
          {
            path: "school/:school/class/:classId",
            element: <ClassManager />,
            errorElement: <ErrorView />
          }
        ]
      },
      {
        path: "view/my/permissions",
        element: <Permissions />,
        errorElement: <ErrorView />,
        loader: loader("user/permissions")
      }
    ]
  },


  {
    path: "/moderators",
    element: <FetchContextProvider>
      <UsersLayout />
    </FetchContextProvider>,
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
        errorElement: <ErrorView />,
        loader: loader("data/schools")
      }
    ]
  },
  {
    path: "/catalog",
    element: <FetchContextProvider>
      <CatalogLayout />
    </FetchContextProvider>,
    errorElement: <NotFound isAuthorized={true} />,
    children: [
      {
        path: ':api/errors',
        element: <Catalog label="Loggfiler" search={true} download="logs/download/by" />,
        errorElement: <ErrorView />,
        loader: loader("logs")
      },
      {
        path: ':api/history',
        element: <Catalog label="Historik" api="data/history" search={true} download="data/download/by" modal={true} disabled={true} />,
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