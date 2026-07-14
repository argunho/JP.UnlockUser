import { useEffect, useRef } from 'react';

// Installed
import { Outlet, useNavigation } from 'react-router-dom';

// Components
import Header from "../components/blocks/Header";
import LinearLoading from './../components/blocks/LinearLoading';

function MainLayout() {

  const refContainer = useRef();
  const navigation = useNavigation();

  useEffect(() => {
    refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
  }, [])

  const loading = navigation.state == "loading";

  return (
    <>
      <Header disabled={loading} />

      <div className="container fade-in-slow" ref={refContainer}>
        <Outlet />
      </div>

      {/* Loading */}
      {loading && <LinearLoading size={30} />}
    </>
  )
}

export default MainLayout;
