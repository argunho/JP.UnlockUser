import { useRef, useEffect } from 'react'; //, use

// Installed
import { Outlet, useNavigation, useNavigate, useLocation } from 'react-router-dom';

// Components
import Header from "../components/blocks/Header";

// Storage

// Functions
import { Claim } from '../functions/DecodedToken';


function CatalogLayout() {

  const navigate = useNavigate();
  const navigation = useNavigation();
  const refContainer = useRef();
  const loc = useLocation();

  const openAccess = Claim("openAccess");

  useEffect(() => {
    refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });

console.log(!!loc)
    if (!openAccess)
      navigate("/")
  }, [loc])

  const loading = navigation.state == "loading";
  return (
    <>
      <Header disabled={loading} supportMode={true}/>

      <div className="container d-column jc-start fade-in-slow" ref={refContainer}>

        <Outlet context={{ loading, name: loc.pathname.split("/").filter(Boolean).pop() }} />
        
      </div>
    </>
  )
}

export default CatalogLayout;