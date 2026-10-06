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

  const access = {
    open: Claim("openAccess"),
    limited: Claim("limitedAccess")
  }

  useEffect(() => {
    refContainer.current?.scrollIntoView({
      behavior: "instant",
      block: "end",
      inline: "nearest"
    });

    const cases = loc.pathname === "/catalog/cases";

    if ((!access.open && !cases) || (!access.limited && !access.open && cases))
      navigate("/")
  }, [loc])

  const loading = navigation.state == "loading";
  return (
    <>
      <Header disabled={loading} supportMode={true} />

      <div className="container d-column jc-start fade-in-slow" ref={refContainer}>
        <Outlet context={{ loading }} /> 
      </div>
    </>
  )
}

export default CatalogLayout;
//name: loc.pathname.split("/").filter(Boolean).pop()