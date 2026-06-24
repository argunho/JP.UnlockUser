import { useEffect, useRef, useState, use } from 'react'; //, use

// Installed
import { Outlet, useNavigation, useParams, useLoaderData } from 'react-router-dom';
import { Button } from '@mui/material';

// Components
import Header from "../components/blocks/Header";
import LinearLoading from './../components/blocks/LinearLoading';
import ModalMessage from './../components/modals/ModalMessage';

// Services
import { ApiRequest } from '../services/ApiRequest';

// Storage
import { FetchContext } from './../storage/FetchContext';


function AppLayout() {


  const refContainer = useRef();
  const navigation = useNavigation();
  const params = useParams();
  const { fetchData } = use(FetchContext);

  const modalMessage = useLoaderData();
  const [open, setOpen] = useState(!!modalMessage);
  const [collections, setCollections] = useState();

  useEffect(() => {
    refContainer.current?.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });

    async function getCollections() {
      const res = await ApiRequest("data/collections");
      setCollections(res ?? []);
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
