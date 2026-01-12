import { useEffect, useRef, useState } from 'react'; //, use

// Installed
import { Outlet, useNavigation, useParams } from 'react-router-dom';

// Components
import Header from "../components/blocks/Header";
import LinearLoading from './../components/blocks/LinearLoading';

// Services
import { ApiRequest } from '../services/ApiRequest';


function AppLayout() {

  const [ collections, setCollections ] = useState();

  const refContainer = useRef();
  const navigation = useNavigation();
  const params = useParams();

  useEffect(() => {
    refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });

    async function getCollections(){
      const res = await ApiRequest("data/dashboard");
      setCollections(res ?? []);
    }

    getCollections()
  }, []);

  const loads = !collections;

  return (
    <>
      <Header disabled={loads} />

      <div className="container d-column jc-start fade-in" ref={refContainer}>

        {!loads && <Outlet context={{  
          ...params,
          collections, 
          groups: collections?.groups, 
          schools: collections?.schools, 
          loading: navigation.state === "loading" 
           }} />}

        {/* Loading */}
        {loads && <LinearLoading size={30} cls="curtain" />}
      </div>
    </>

  )
}

export default AppLayout;
