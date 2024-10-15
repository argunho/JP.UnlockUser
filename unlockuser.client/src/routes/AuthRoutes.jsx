
import { Route, Routes, useNavigate } from "react-router-dom";

// Pages
import EmployeesList from "../pages/auth/EmployeesList";
import SessionHistory from "./../pages/auth/SessionHistory";
import UsersManager from "./../pages/auth/UsersManager";
import LogFiles from "./../pages/auth/LogFiles";
import UserManager from "../pages/auth/UserManager";
import Members from "./../pages/auth/Members";
import Search from "./../pages/auth/Search";
import Schools from "./../pages/auth/Schools";
import Contacts from "./../pages/open/Contacts";
import NotFound from "./../pages/open/NotFound";


function AuthRoutes({authContext }) {

  const navigate = useNavigate();

  const routes = [
    {
      index: true,
      path: "/",
      element: <Search authContext={authContext} navigate={navigate} />
    },
    {
      path: "/employees",
      element: <EmployeesList />
    },
    {
      path: '/manage-user/:id',
      element: <UserManager authContext={authContext} navigate={navigate} />
    },
    {
      path: '/manage-users/:cls/:school',
      element: <UsersManager authContext={authContext} navigate={navigate}/>
    },
    {
      path: '/history',
      element: <SessionHistory />
    },
    {
      path: '/logs',
      element: <LogFiles />
    },
    {
      path: '/schools',
      element: <Schools authContext={authContext} label="Skolor" api="data/schools" id="name" 
                        fields={{name: "", place: ""}} labels={["Namn", "Plats"]} navigate={navigate} />
    },
    {
      path: '/contact',
      element: <Contacts />
    },
    {
      path: '/members/:office/:department',
      element: <Members navigate={navigate} />,
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