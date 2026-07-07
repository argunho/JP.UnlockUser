import { useRef, useEffect } from 'react'; //, use

// Installed
import { Outlet, useNavigation, useNavigate, useLocation } from 'react-router-dom';

// Components
import Header from "../components/blocks/Header";
import LinearLoading from '../components/blocks/LinearLoading';

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

    if (!openAccess)
      navigate("/")
  }, [loc])

  const loading = navigation.state == "loading";
  return (
    <>
      <Header disabled={loading} />

      <div className="container d-column jc-start fade-in" ref={refContainer}>

        <Outlet context={{ loading }} />

        {/* Loading */}
        {loading && <div className="d-column curtain">
          <LinearLoading size={30} cls="curtain" />
        </div>}
      </div>
    </>
  )
}

export default CatalogLayout;