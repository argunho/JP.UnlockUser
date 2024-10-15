// Installed
import { Route, Routes } from "react-router-dom";

// Pages
import Login from "./../pages/open/Login";
import Contacts from "./../pages/open/Contacts";
import NotFound from "./../pages/open/NotFound";

function AppRoutes({authContext}) {
  const routes = [
    {
      index: true,
      path: "/",
      element: <Login authContext={authContext}/>
      },
      {
          path: '/contact',
          element: <Contacts />
      },
  ];

  return <Routes>
    {routes.map((route, index) => {
      const { element, ...rest } = route;
      return <Route key={index} {...rest} element={element} />;
    })}

    {/* If route is no exists */}
    <Route path="/*" element={<NotFound />} />
  </Routes>
}

export default AppRoutes;
