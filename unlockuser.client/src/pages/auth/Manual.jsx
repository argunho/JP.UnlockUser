import { useEffect, useState, use } from 'react';

// Installed
import { useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import { Edit, EditDocument, Delete, Save, SwapVert } from '@mui/icons-material';

// Components
import Message from '../../components/blocks/Message';
import SideMenu from '../../components/menu/SideMenu';
import ModalConfirm from '../../components/modals/ModalConfirm';
import TabPanel from '../../components/blocks/TabPanel';
import ModalSuccess from '../../components/modals/ModalSuccess';
import LinearLoading from '../../components/blocks/LinearLoading';

// Functions
import { DecodedClaims } from '../../functions/DecodedToken';

// Storage
import { FetchContext } from '../../storage/FetchContext';

function Manual({ api, label, menuLabel }) {
  const [manual, setManual] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [sortedNames, setSortedNames] = useState(null);
  const [sortingModel, setSortingMode] = useState(false);

  const { openAccess } = DecodedClaims()
  const manuals = useLoaderData();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const { pending, success, response, fetchData, handleResponse } = use(FetchContext);

  useEffect(() => {
    document.title = "UnlockUser | Manual";

  }, [manuals])

  async function deleteItem() {
    setConfirm(false);

    const id = manual ? manual?.id : manuals[0]?.id;
    await fetchData({ api: `${api}/${id}`, method: "delete" });
  }

  function closeModal() {
    handleResponse();
    revalidator.revalidate();
    setManual();
    // navigate("/manual", { replace: true });
  }

  function toggleSortingModel() {
    if (sortingModel) setSortedNames(null);
    setSortingMode(prev => !prev);
  }

  function handleSortChange(newItems) {
    setSortedNames(newItems.map(item => item?.name ?? item));
  }

  async function saveSorting() {
    const res = await fetchData({ api: "manual/sorting", method: "post", data: sortedNames, action: "return" });
    if (res !== undefined) {
      setSortedNames(null);
      setSortingMode(false);
      revalidator.revalidate();
    }
  }

  const noFound = (!manuals || manuals?.length == 0);
  const isDirty = sortedNames !== null &&
    !sortedNames.every((name, i) => name === manuals[i]?.name);

  return (
    <div className="d-column jc-start w-100 mh">

      {/* Tab menu */}
      <TabPanel primary={label} secondary={manuals[0]?.popup ? "Popup meddelande" : manual?.primary?.toUpperCase()}>


        {/* Delete manual */}
        {(!noFound && openAccess && !sortingModel) && <>
          <Tooltip title="Radera dokument" classes={{ tooltip: "tooltip-white" }} arrow>
            <IconButton color="error" onClick={() => setConfirm(true)} >
              <Delete />
            </IconButton>
          </Tooltip>

          {/*  Edit manual */}
          <Tooltip title="Redigera dokument" classes={{ tooltip: "tooltip-white" }} arrow>
            <IconButton color="primary" onClick={() => navigate(`edit/${manual ? manual?.id : manuals[0]?.id}`)} >
              <Edit />
            </IconButton>
          </Tooltip>
        </>}


        {/* Save sort order — visible only in sorting mode, enabled only when order changed */}
        {(!noFound && openAccess && sortingModel) && (
          <Tooltip title="Spara sortering" classes={{ tooltip: "tooltip-white" }} arrow>
            <span style={{ marginLeft: "8px" }}>
              <IconButton color={isDirty ? "success" : "default"} onClick={saveSorting} disabled={pending || !isDirty}>
                <Save />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {/* Toggle sort mode */}
        {(!noFound && openAccess) && (
          <Tooltip title={sortingModel ? "Avbryt sortering" : "Sortera lista"} classes={{ tooltip: "tooltip-white" }} arrow>
            <IconButton color={sortingModel ? "primary" : "default"} onClick={toggleSortingModel} >
              <SwapVert />
            </IconButton>
          </Tooltip>
        )}

        {/* New manual */}
        {openAccess && <Tooltip title="Skapa manual" color="secondary" classes={{ tooltip: "tooltip-white" }} arrow>
          <IconButton onClick={() => navigate("new")} style={{ marginLeft: noFound ? 0 : "20px" }}>
            <EditDocument />
          </IconButton>
        </Tooltip>}
      </TabPanel>

      {/* If manuals is not exists */}
      {noFound && <Message res={0} cancel={() => navigate(-1)} />}

      {/* If response */}
      {response && <Message res={response} cancel={() => handleResponse()} />}

      <div className="d-row jc-between ai-start w-100">

        {/* Menu */}
        <SideMenu key={success} label={menuLabel} list={manuals} disabled={pending} clickHandle={setManual}
          sortable={openAccess && !noFound && sortingModel} onSortChange={handleSortChange} />

        {/* Manual content view */}
        {manuals?.length > 0 &&
          <div key={manual?.name} className="box-wrapper fade-in w-100"
            dangerouslySetInnerHTML={{ __html: (manual ?? manuals?.[0])?.html }}></div>}

      </div>

      {/* Confirm modal */}
      {confirm && <ModalConfirm onConfirm={deleteItem} onClose={() => setConfirm(false)} />}

      {/* Success modal */}
      {success && <ModalSuccess onClose={closeModal} />}

      {/* Loading */}
      {pending && <LinearLoading size={30} />}
    </div>
  )
}

export default Manual
