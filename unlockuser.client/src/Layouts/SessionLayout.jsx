import { useEffect, useRef } from 'react';

// Installed
import { Outlet, useNavigation } from 'react-router-dom';

function SessionLayout() {
    const refContainer = useRef();
    const navigation = useNavigation();

    useEffect(() => {
        refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
    }, [])

    return (
        <div className="container" ref={refContainer}>
            <Outlet context={{ loading: navigation.state === "loading" }} />
        </div>
    )
}

export default SessionLayout
