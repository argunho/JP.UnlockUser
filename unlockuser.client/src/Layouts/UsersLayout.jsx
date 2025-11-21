import { useEffect, useRef } from 'react';

// Installed
import { Outlet, useNavigation, useParams, useLoaderData } from 'react-router-dom';

function UsersLayout() {
    const refContainer = useRef();
    const navigation = useNavigation();
    const { group, office, department } = useParams();

    const groups = useLoaderData();

    useEffect(() => {
        refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
    }, [])

    return (
        <div className="container" ref={refContainer}>
            <Outlet context={{ loading: navigation.state === "loading", groups, group, office, department }} />
        </div>
    )
}

export default UsersLayout;