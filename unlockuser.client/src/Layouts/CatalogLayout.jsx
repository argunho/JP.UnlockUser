import { useRef, useEffect } from 'react'; //, use

// Installed
import { Outlet, useNavigation, useParams, useNavigate } from 'react-router-dom';

// Components
import Header from "../components/blocks/Header";
import LinearLoading from '../components/blocks/LinearLoading';

// Storage

// Functions
import { Claim } from '../functions/DecodedToken';


function CatalogLayout() {

  const navigate = useNavigate();
  const navigation = useNavigation();
  const params = useParams();
  const refContainer = useRef();

  const openAccess = Claim("openAccess");

  console.log(openAccess)

  useEffect(() => {
    refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });

    if (!openAccess)
      navigate("/")
  }, [])

  const loading = navigation.state == "loading";
  console.log(loading)
  return (
    <>
      <Header disabled={loading} />

      <div className="container d-column jc-start fade-in" ref={refContainer}>

        <Outlet context={{
          ...params,
        }} />

        {/* Loading */}
        {loading && <div className="d-column curtain">
          <LinearLoading size={30} cls="curtain" />
        </div>}
      </div>
    </>
  )
}

export default CatalogLayout;