// Installed
import { Outlet, useNavigation } from 'react-router-dom';

// Components
import LinearLoading from '../components/blocks/LinearLoading';

function OpenLayout() {

    const navigation = useNavigation()

    const loading = navigation.state === "loading";

    // This layout is used for public pages that do not require authentication
    return (
        <main className="container d-column jc-start w-100">
            <Outlet />

            {/* Loading */}
            {loading && <LinearLoading size={30} />}
        </main>
    )
}

export default OpenLayout;