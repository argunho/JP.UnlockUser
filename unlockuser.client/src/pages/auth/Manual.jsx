import { useEffect, useState, use } from 'react';

// Installed
import { useLoaderData, useNavigate } from 'react-router-dom';
import { Skeleton, Button, IconButton, Tooltip } from '@mui/material';
import { Edit, EditSquare, Delete } from '@mui/icons-material';

// Components
import Message from '../../components/blocks/Message';
import SideMenu from '../../components/menu/SideMenu';
import ModalConfirm from '../../components/modals/ModalConfirm';
import TabPanel from '../../components/blocks/TabPanel';
import ModalSuccess from '../../components/modals/ModalSuccess';
import LinearLoading from '../../components/blocks/LinearLoading';

// Storage
import { FetchContext } from '../../storage/FetchContext';

function Manual() {
  const [manual, setManual] = useState(null);
  const [confirm, setConfirm] = useState(false);

  const manuals = useLoaderData();
  const navigate = useNavigate();

  const { pending, success, response, fetchData, handleResponse } = use(FetchContext);
  console.log(manuals)
  useEffect(() => {
    document.title = "UnlockUser | Manual";

  }, [manuals])

  async function deleteItem() {
    setConfirm(false);

    const id = manual ? manual?.id : manuals[0]?.id;
    await fetchData({ api: `manual/${id}`, method: "delete" });
  }

  function closeModal() {
    handleResponse();
    navigate("/manual", { replace: true });
  }

  const noFound = (!manuals || manuals?.length == 0);

  return (
    <div className="d-column jc-start w-100 mh">

      {/* Tab menu */}
      <TabPanel primary="Webbapp-manual" secondary={manual?.name?.replace(".txt", "")}>

        {/* Delete manual */}
        {<>
          <Tooltip title="Radera dokument" classes={{ tooltip: "tooltip-white" }} arrow>
            <IconButton color="error" onClick={deleteItem}>
              <Delete />
            </IconButton>
          </Tooltip>

          {/*  Edit manual */}
          <Tooltip title="Redigera dokument" classes={{ tooltip: "tooltip-white" }} arrow>
            <IconButton color="primary" onClick={() => navigate(`edit/${manual ? manual?.id : manuals[0]?.id}`)} style={{marginLeft: "20px"}}>
              <Edit />
            </IconButton>
          </Tooltip>
        </>}

        {/* New manual */}
        <Tooltip title="Skapa manual" color="secondary" classes={{ tooltip: "tooltip-white" }} arrow>
          <IconButton onClick={() => navigate("new")} style={{marginLeft: noFound ? 0 : "20px"}}>
            <EditSquare />
          </IconButton>
        </Tooltip>
      </TabPanel>

      {/* If manuals is not exists */}
      {noFound && <Message res={0} cancel={() => navigate(-1)} />}

      {/* If response */}
      {response && <Message res={response} cancel={() => handleResponse()} />}

      <div className="d-row jc-between ai-start w-100">

        {/* Menu */}
        <SideMenu label="Kunskapsartiklar" list={manuals} disabled={pending} clickHandle={setManual} />

        {/* Manual content view */}
        {manuals?.length > 0 &&
          <div key={manual?.name} className="d-column ai-start jc-start wrapper-div fade-in w-100"
            dangerouslySetInnerHTML={{ __html: (manual ?? manuals?.[0])?.html }}></div>}

      </div>

      {/* Confirm modal */}
      {confirm && <ModalConfirm clickHandle={deleteItem} close={() => setConfirm(false)} />}

      {/* Success modal */}
      {success && <ModalSuccess close={closeModal} />}

      {/* Loading */}
      {pending && <LinearLoading size={30} />}
    </div>
  )
}

export default Manual
