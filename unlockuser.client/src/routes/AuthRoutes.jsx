
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

// Pages
import EmployeesList from "../pages/auth/EmployeesList";
import SessionHistory from "./../pages/auth/SessionHistory";
import UsersManager from "./../pages/auth/UsersManager";
import LogFiles from "./../pages/auth/LogFiles";
import UserManager from "../pages/auth/UserManager";
import Members from "./../pages/auth/Members";
import Search from "./../pages/auth/Search";
import ListView from "../pages/auth/ListView";
import Contacts from "./../pages/open/Contacts";
import NotFound from "./../pages/open/NotFound";


function AuthRoutes({authContext }) {

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
      element: <Search {...props} />
    },
    {
      path: "/employees",
      element: <EmployeesList />
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
      path: '/history',
      element: <SessionHistory />
    },
    {
      path: '/logs/:param',
      element: <LogFiles  {...props} />
    },
    {
      path: '/statistics',
      element: <ListView {...props} label="Statistik" api="data/statistics"/>
    },
    {
      path: '/schools',
      element: <ListView {...props} label="Skolor" api="data/schools" id="name" fields={{name: "", place: ""}} labels={["Namn", "Plats"]}  />
    },
    {
      path: '/contact',
      element: <Contacts />
    },
    {
      path: '/members/:office/:department',
      element: <Members {...props} />,
    //   routes: [
    //     {
    //       path: "",
    //       element: <ListView api="form" />
    //     },
    //   ]
    },
    // {
    //       path: "/service/in/progress",
    //       element: <WorkInProgress authContext={authContext} navigate={navigate} />
    //     },
    // {
    //   path: "logout",
    //   element: <Logout />
    // }

  ];

  return <Routes>
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

    {/* If route is no exists */}
    <Route path="/*" element={<NotFound />} />
  </Routes>
}

export default AuthRoutes;