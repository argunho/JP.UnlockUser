// Installed
import { Outlet, useNavigation } from 'react-router-dom';

function SessionLayout() {
    const navigation = useNavigation();

    return (
        <div className="container fade-in-slow">
            <Outlet context={{ loading: navigation.state === "loading" }} />
        </div>
    )
}

export default SessionLayout;
