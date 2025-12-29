import { useEffect, useRef, use } from 'react';

// Installed
import { Outlet, useNavigation, useLoaderData, useParams } from 'react-router-dom';

// Components
import Header from "../components/blocks/Header";
import LinearLoading from './../components/blocks/LinearLoading';

// Storage
import { DashboardContext } from '../storage/DashboardContext';


function AppLayout() {
  const dashboardData = use(DashboardContext);

  const refContainer = useRef();
  const navigation = useNavigation();
  const params = useParams();

  const loads = dashboardData?.loading || navigation.state === "loading";
  const schools = useLoaderData();

  useEffect(() => {
    refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
  }, [])

  return (
    <>
      <Header disabled={loads} />

      <div className="container d-column jc-start fade-in" ref={refContainer}>

        {!loads && <Outlet context={{ loading: loads, ...dashboardData, ...params, schools }} />}

        {/* Loading */}
        {loads && <LinearLoading size={30} msg="Var vänlig vänta, data hämtas ..." cls="curtain" />}
      </div>
    </>

  )
}

export default AppLayout;
