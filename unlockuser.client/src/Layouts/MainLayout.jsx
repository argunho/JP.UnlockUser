import{ use } from 'react';

// Installed
import { Outlet, useNavigation, useParams } from 'react-router-dom';

// Storage
import { DashboardContext } from '../storage/DashboardContext';


function MainLayout() {
  const dashboardData = use(DashboardContext);

  const navigation = useNavigation();
  const params = useParams();

  const loads = dashboardData?.loading || navigation.state === "loading";


  return (
      <div className="d-column jc-start w-100">

        {!loads && <Outlet context={{ loading: loads, ...dashboardData, ...params }} />}

      </div>
  )
}

export default MainLayout;