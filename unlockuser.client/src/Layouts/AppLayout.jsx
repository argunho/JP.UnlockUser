import { useEffect, useRef, useState, use } from 'react'; //, use

// Installed
import { Outlet, useNavigation, useParams, useLoaderData, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@mui/material';

// Components
import Header from "../components/blocks/Header";
import LinearLoading from './../components/blocks/LinearLoading';
import ModalMessage from './../components/modals/ModalMessage';

// Storage
import { FetchContext } from './../storage/FetchContext';

// Functions
import { Claim } from '../functions/DecodedToken';


function AppLayout() {

  const refContainer = useRef();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const loc = useLocation();
  const params = useParams();
  const { fetchData, data: collections } = use(FetchContext);

  const modalMessage = useLoaderData();

  const [open, setOpen] = useState(!!modalMessage);

  const permissions = Claim("permissions")?.split(',');

  useEffect(() => {
    refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });

    async function getCollections() {
      await fetchData({ api: "data/collections", action: "complete" });
    }

    getCollections()
  }, []);

  useEffect(() => {
    if ((loc.pathname === "/search" || loc.pathname === "/") && !!permissions) {
      navigate(`/search/${permissions?.[0]?.toLowerCase()}`, { replace: true });
    }
  }, [loc])


  async function hideMessage() {
    setOpen(false);
    await fetchData({ api: "article/hide/popup/message", method: "post", action: "clean" });
  }

  const loading = !collections || navigation.state == "loading";

  return (
    <>
      <Header disabled={loading} />

      <div className="container d-column jc-start fade-in-slow" ref={refContainer}>

        <Outlet context={{
          ...params,
          collections,
          groups: collections?.groups,
          schools: collections?.schools
        }} />

        {/* Loading */}
        {loading && <LinearLoading size={30} />}
      </div>

      {/* Modal message */}
      {open && <ModalMessage
        label={`<p style='font-size: 32px'>${modalMessage?.primary}</p>`}
        content={modalMessage?.html}
        childrenButton={true}>
        <Button variant="contained" color="default" onClick={hideMessage}>
          Visa inte meddelandet igen
        </Button>
      </ModalMessage>}
    </>

  )
}

export default AppLayout;
