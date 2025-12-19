import { useEffect, useRef } from 'react';

// Installed
import { Outlet, useNavigation, useParams, useLoaderData } from 'react-router-dom';

// Components
import Header from '../components/blocks/Header';
import LinearLoading from '../components/blocks/LinearLoading';

function UsersLayout() {
    const refContainer = useRef();
    const navigation = useNavigation();
    const params = useParams();

    const groups = useLoaderData();
    const loads = navigation.state === "loading";
    

    useEffect(() => {
        refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
    }, [])

    return (
        <>
            <Header disabled={loads} />

            <div className="container d-column jc-start fade-in" ref={refContainer}>

                {!loads && <Outlet context={{ loading: loads, ...params, groups }} />}

                {/* Loading */}
                {loads && <LinearLoading size={30} msg="Var vänlig vänta, data hämtas ..." cls="curtain" />}
            </div>
        </>

    )
}

export default UsersLayout;