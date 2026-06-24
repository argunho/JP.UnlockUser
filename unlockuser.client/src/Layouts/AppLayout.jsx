import { useEffect, useRef, useState, use } from 'react'; //, use

// Installed
import { Outlet, useNavigation, useParams, useLoaderData, useNavigate } from 'react-router-dom';
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
  const params = useParams();
  const { group } = params;
  const { fetchData, resData: collections } = use(FetchContext);

  const modalMessage = useLoaderData();

  const [open, setOpen] = useState(!!modalMessage);

  const permissions = Claim("permissions")?.split(',');

  useEffect(() => {
    refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });

    if(!group){
      navigate(`search/${permissions[0]?.toLowerCase()}`, { replace: true });
    }

    async function getCollections() {
      await fetchData({ api: "data/collections" });
    }

    getCollections()
  }, []);


  async function hideMessage() {
    setOpen(false);
    await fetchData({ api: "article/hide/popup/message", method: "post" });
  }

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

      {/* Modal message */}
      {open &&
        <ModalMessage
          label={`<p style='font-size: 32px'>${modalMessage?.name}</p>`}
          content={modalMessage?.html}
          childrenButton={true}>
          <Button variant="contained" color="default" onClick={hideMessage} >
            Visa inte meddelandet igen
          </Button>
        </ModalMessage>}
    </>

  )
}

export default AppLayout;
