import{ use } from 'react';

// Installed
import { Outlet, useNavigation, useParams } from 'react-router-dom';

// Components
import LinearLoading from './../components/LinearLoading';
import Header from '../components/blocks/Header';

// Storage
import { DashboardContext } from '../storage/DashboardContext';


function MainLayout() {
  const dashboardData = use(DashboardContext);

  const navigation = useNavigation();
  const params = useParams();

  const loads = dashboardData?.loading || navigation.state === "loading";


  return (
    <>
      <Header disabled={loads} />

      <div className="container d-column jc-start fade-in">

        {!loads && <Outlet context={{ loading: loads, ...dashboardData, ...params }} />}

        {/* Loading */}
        {loads && <LinearLoading size={30} msg="Var vänlig vänta, data hämtas ..." cls="curtain" />}
      </div>
    </>
  )
}

export default MainLayout;