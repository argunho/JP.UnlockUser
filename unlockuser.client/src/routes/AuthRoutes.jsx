import { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

// Installed
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

// Pages
import ViewList from "./../pages/auth/ViewList";
import SessionHistory from "./../pages/auth/SessionHistory";
import UsersManager from "./../pages/auth/UsersManager";
import LogFiles from "./../pages/auth/LogFiles";
import Contacts from "./../pages/auth/Contacts";
import Members from "./../pages/auth/Members";
import NotFound from "../pages/open/NotFound";

// Components
import SearchFilter from "./../components/SearchFilter";

// Functions
import { ErrorHandle } from "../functions/ErrorHandle";
import { DecodedToken } from "../functions/DecodedToken";

// Services
import ApiRequest from "../services/ApiRequest";

// Storage

// Css

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  // [::1] is the IPv6 localhost address.
  window.location.hostname === '[::1]' ||
  // 127.0.0.0/8 are considered localhost for IPv4.
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

function AuthRoutes({authContext }) {

  const [group, setGroup] = useState((sessionStorage.getItem("group"))?.toLowerCase() ?? "");
  const [updatePage, setUpdatePage] = useState(false);
  const [connection, setConnection] = useState();

  const navigate = useNavigate();

  const routes = [
    {
      index: true,
      path: "/",
      element: <SearchFilter group={group} updateGroup={updateGroup} />
    },
    {
      path: "/members",
      element: <ViewList />
    },
    {
      path: '/manage-user/:id',
      element: <UsersManager group={group} />
    },
    {
      path: '/manage-users/:class/:school',
      element: <UsersManager group={group} />
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
      path: '/contact',
      element: <Contacts />
    },
    {
      path: '/members/:office/:department',
      element: <Members group={group} />
    },
    // {
    //   path: "/categories/:key/:path",
    //   element: <Section update={updatePage} />,
    //   routes: [
    //     {
    //       path: "",
    //       element: <ListView api="form" />
    //     },
    //   ]
    // },
    // {
    //       path: "/service/in/progress",
    //       element: <WorkInProgress authContext={authContext} navigate={navigate} />
    //     },
    // {
    //   path: "logout",
    //   element: <Logout />
    // }

  ];

  useEffect(() => {
    if (!connection)
      joinConnection();

    checkStatusOfService();

    
    if (isLocalhost)
      console.log(authContext.authToken)
  }, [])

  async function joinConnection() {
    if (isLocalhost) {
      console.log(localStorage.getItem("token") || sessionStorage.getItem("token"))
      return;
    }
    // const url = "wss://" + window.location.host + "/dashboard";
    const url = "https://" + window.location.host + "/dashboard";
    const email = DecodedToken(authContext.token)?.Email;
    //        .withUrl(url,{
    //     skipNegotiation: true,
    //     transport: HttpTransportType.WebSockets
    // })
    try {
      const connection = new HubConnectionBuilder()
        .withUrl(url)
        .configureLogging(LogLevel.Information)
        .build();

      connection.on("ConnectionMessage", (res, message) => {
        console.log(message)
      });

      connection.on("UpdateSurvey", (user, msg) => {

        setUpdatePage(user !== email);
        setTimeout(() => {
          setUpdatePage(false);
        }, 2000);
      })

      connection.on("UpdateServiceStatus", (status, user, updated) => {
        if (status)
          navigate("/service/in/progress");
        else
          navigate("/");

        console.log(updated)

        authContext.updateServiceWorkStatus(status, user !== email);
      })

      connection.onclose(e => {
        setConnection();
      })

      await connection.start();
      await connection.invoke("JoinConnection", { connection: "survey", email: email });

      setConnection(connection);
    } catch (error) {
      console.error("Join connection => " + error);
    }
  }

  // Check the status of app service work
  async function checkStatusOfService() {
    await ApiRequest("app/status/of/service/work").then(res => {
      authContext.updateServiceWorkStatus(res?.data?.status, res.data.hide);
      if (!!res?.data.status && !!res.data.hide)
        navigate("/service/in/progress");
      // navigate("/service/in/progress", { state: { message: res.data } });
    }, error => console.warn(ErrorHandle(error, navigate)));
  }


  function updateGroup(value) {
    sessionStorage.setItem("group", value?.toLowerCase());
    setGroup(value?.toLowerCase());
  }

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