// Installed
import { Outlet, useNavigation, useParams, useLoaderData } from 'react-router-dom';

// Components
import LinearLoading from '../components/blocks/LinearLoading';

function UsersLayout() {
    const navigation = useNavigation();
    const params = useParams();

    const groups = useLoaderData();
    const loads = navigation.state === "loading";


    return (
        <div className="d-column jc-start fade-in w-100">

            {!loads && <Outlet context={{ loading: loads, ...params, groups }} />}

            {/* Loading */}
            {loads && <LinearLoading size={30} msg="Var vänlig vänta, data hämtas ..." cls="curtain" />}
        </div>
    )
}

export default UsersLayout;