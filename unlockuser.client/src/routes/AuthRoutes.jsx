
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

// Pages
import EmployeesList from "../pages/auth/EmployeesList";
import UsersManager from "./../pages/auth/UsersManager";
import LogFiles from "./../pages/auth/LogFiles";
import UserManager from "../pages/auth/UserManager";
import Members from "./../pages/auth/Members";
import Home from "./../pages/auth/Home";
import ListView from "../pages/auth/ListView";
import Contacts from "./../pages/open/Contacts";
import Logout from "../pages/auth/Logout";
import NotFound from "./../pages/auth/NotFound";

// Components
import Header from "../components/Header";
import ExpiredSession from './../components/ExpiredSession';

// Functions
import SessionData from "../functions/SessionData";

// Css
// import 'bootstrap/dist/css/bootstrap.css';
import '../assets/css/form.css';
import '../assets/css/blocks.css';


function AuthRoutes({ authContext }) {

  const navigate = useNavigate();
  const loc = useLocation();

  const props = {
    authContext,
    navigate,
    loc
  };

  const routes = [
    {
      index: true,
      path: "/",
      element: <Home {...props} />
    },
    {
      path: "/employees",
      element: <EmployeesList {...props} />
    },
    {
      path: "/employees/:groupName",
      element: <EmployeesList {...props} />
    },
    {
      path: '/manage-user/:id',
      element: <UserManager {...props} />
    },
    {
      path: '/manage-users/:cls/:school',
      element: <UsersManager {...props} />
    },
    {
      path: '/session/history',
      element: <ListView {...props} includedList={SessionData("sessionWork")} label="Session historia" fullWidth={true} />
    },
    {
      path: '/logs/:param',
      element: <LogFiles {...props} />
    },
    {
      path: '/statistics',
      element: <ListView {...props} label="Statistik" api="data/statistics" fullWidth={true} />
    },
    {
      path: '/schools',
      element: <ListView {...props} label="Skolor" api="data/schools" id="id" fields={{ name: "", place: "" }} labels={["Namn", "Plats"]} />
    },
    {
      path: '/contact',
      element: <Contacts isAuthorized={true} />
    },
    {
      path: '/members/:office/:department',
      element: <Members {...props} />,
    },
    {
      path: "/session/expired",
      element: <ExpiredSession />
    },
    {
      path: "/logout",
      element: <Logout />
    },
    {
      path: "/*",
      element: <NotFound isAuthorized={true} />,
      open: true
    }
  ];

  return <>
    <Header />

    <div className="container" id="container">
      <Routes>
        {routes.map((route, index) => {
          const { element, ...rest } = route;

          if (!!rest?.routes) {
            return <Route key={index} {...rest} element={element} >
              {rest?.routes?.map((children, ind) => {
                const { element, ...rest } = children;
                return <Route key={ind} {...rest} element={element} />;
              })}
            </Route>
          } else
            return <Route key={index} {...rest} element={element} />;
        })}
      </Routes>
    </div>
  </>
}

export default AuthRoutes;