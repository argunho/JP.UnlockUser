// Installed
import { Outlet, useNavigation, useOutletContext, useLoaderData } from 'react-router-dom';

function UsersLayout() {
    const navigation = useNavigation();

    const context = useOutletContext();
    const moderators = useLoaderData();
    context.loading = navigation.state === "loading";

    return (
        <div className="d-column jc-start w-100">
            <Outlet context={{ ...context, moderators }} />
        </div>
    )
}

export default UsersLayout;