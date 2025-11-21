import { useEffect, useRef } from 'react';

// Installed
import { Outlet, useNavigation, useLoaderData } from 'react-router-dom';

// Components
import Header from "../components/blocks/Header";


function AppLayout() {

  const refContainer = useRef();
  const navigation = useNavigation();

  const schools = useLoaderData();

  useEffect(() => {
    refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
  }, [])

  return (
    <>
      <Header />

      <div className="container d-column jc-start fade-in" ref={refContainer}>
        <Outlet context={{ loading: navigation.state === "loading", schools }} />
      </div>
    </>

  )
}

export default AppLayout
