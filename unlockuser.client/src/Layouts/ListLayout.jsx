import { useEffect, useRef } from 'react';

// Installed
import { Outlet, useNavigation } from 'react-router-dom';

// Components
import Header from "../components/blocks/Header";

function ListLayout() {

  const refContainer = useRef();
  const navigation = useNavigation();

  useEffect(() => {
    refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
  }, [])


  return (
    <>
      <Header />

      <div className="container fade-in" ref={refContainer}>
        <Outlet context={{ loading: navigation.state === "loading" }} />
      </div>
    </>

  )
}

export default ListLayout;
