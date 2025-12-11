
import { useRef, useState } from 'react';

// Installed
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';

// Components
import Table from '../lists/Table';
import FormButtons from '../forms/FormButtons';

// Functions
function ModalPreview({ open = true, list, label, subLabel, onSetFile, onSubmit, onChange, onClose }) {

    const [confirm, setConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const refPrint = useRef(null);
    const refSubmit = useRef(null);

    // Confirm handle
    function confirmHandle(save) {
        setConfirm(true);
        onSetFile(save);
        refSubmit.current?.click();
    }

    function onCancel(){
        setConfirm(false);
        onSetFile(false);
    }

    return (
        <>
            {/* Modal dialog window */}
            <Dialog
                open={open}
                onClose={onClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                draggable={false}
                className='modal-wrapper print-page'
                id="preview-modal"
                sx={{
                    zIndex: 3000
                }}
                ref={refPrint}>

                <DialogTitle
                    id="dialog-title"
                    color="-moz-initial"
                    sx={{
                        marginTop: "20px",
                        marginBottom: "20px"
                    }}
                    dangerouslySetInnerHTML={{ __html: label }}>
                </DialogTitle>

                {/* View this block if data is an array */}
                <DialogContent style={{ marginBottom: "25px", maxHeight: 400 }}>
                    {/* The table component is required to display the list of students and a list of generated passwords for them. */}
                    <Table
                        name={`${label}<br/><small>${subLabel}</small>`}
                        columns={["Namn", "Användarnamn", "Lösenord"]}
                        rows={["name", "username", "password"]}
                        list={list} />
                </DialogContent>

                <DialogActions className="no-print buttons-wrapper">

                    <FormButtons
                        label="Verkställ"
                        swap={true}
                        confirmable={true}
                        onSubmit={onSubmit}
                        onCancel={onCancel}
                        ref={refSubmit}
                    >
                        {!confirm && <div className='d-row jc-between w-100'>

                            <Button
                                variant="contained"
                                className="mobile-hidden"
                                color="info" onClick={onChange}>
                                <Refresh />
                            </Button>

                            <Button
                                className='button-btn'
                                color="primary"
                                onClick={() => confirmHandle(true)}>
                                Spara & Verkställ
                            </Button>

                        </div>}
                    </FormButtons>

                </DialogActions>
            </Dialog>

        </>
    );
}
export default ModalPreview;
