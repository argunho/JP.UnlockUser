// Installed
import { Outlet, useNavigation, useLoaderData, useParams, use } from 'react-router-dom';

// Components
import LinearLoading from './../components/LinearLoading';

// Storage
import { DashboardContext } from '../storage/DashboardContext';


function MainLayout() {
  const navigation = useNavigation();
  const { group, id } = useParams();

  const dashboardData = use(DashboardContext);
  const loads = dashboardData?.loading;
  const schools = useLoaderData();

  return (
    <>
        {!loads && <Outlet context={{ loading: navigation.state === "loading", dashboardData, schools, group, id }} />}

        {/* Loading */}
        {loads && <LinearLoading size={30} msg="Var vänlig vänta, data hämtas ..." cls="curtain" />}
    </>

  )
}

export default MainLayout;