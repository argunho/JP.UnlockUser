// Installed
import { Outlet, useNavigation } from 'react-router-dom';

// Components
import LinearLoading from '../components/blocks/LinearLoading';

function OpenLayout() {

    const navigation = useNavigation()

    // This layout is used for public pages that do not require authentication
    return (
        <main className="container d-column jc-start w-100">
            <Outlet />

            {/* Loading */}
            {navigation.state === "loading" && <LinearLoading size={30} color="success" cls="curtain" />}
        </main>
    )
}

export default OpenLayout;