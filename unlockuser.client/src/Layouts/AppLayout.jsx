import { useEffect, useRef, use } from 'react';

// Installed
import { Outlet, useNavigation, useLoaderData, useParams } from 'react-router-dom';

// Components
import Header from "../components/blocks/Header";
import LinearLoading from './../components/LinearLoading';

// Storage
import { DashboardContext } from '../storage/DashboardContext';


function AppLayout() {
 const { dashboardData, loading: load } = use(DashboardContext);

  const refContainer = useRef();
  const navigation = useNavigation();
  const { group } = useParams();

  const schools = useLoaderData();

  useEffect(() => {
    refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
  }, [])

  return (
    <>
      <Header disabled={load} />

      <div className="container d-column jc-start fade-in" ref={refContainer}>

        {!load && <Outlet context={{ loading: navigation.state === "loading", collections: dashboardData, schools, groupName: group }} />}

        {/* Loading */}
        {load && <LinearLoading size={30} msg="Var vänlig vänta, data hämtas ..." cls="curtain"/>}
      </div>
    </>

  )
}

export default AppLayout
