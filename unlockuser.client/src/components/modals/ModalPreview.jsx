
import { useRef, useState } from 'react';

// Installed
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { Refresh, Print } from '@mui/icons-material';

// Components
import Table from '../lists/Table';
import FormButtons from '../forms/FormButtons';
import { PDFConverter } from '../../functions/PDFConverter';

// Functions
function ModalPreview({ open = true, data, label, subLabel, onChange, onClose }) {

    const [confirm, setConfirm] = useState(false);
    const [savePdf, setSavePdf] = useState(false);

    const refPrint = useRef(null);
    const refSubmit = useRef(null);

    // Confirm handle
    function confirmHandle() {
        setConfirm(true);
        saveApply();
    }

    function close() {
        setConfirm(false);
    }

    function saveApply() {
        PDFConverter(label, subLabel);
        // refSubmit.current?.click();
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
                id="preview"
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
                        list={data} />
                </DialogContent>

                <DialogActions className="no-print buttons-wrapper">

                    <FormButtons
                        label="Verkställ"
                        swap={true}
                        confirmable={true}
                        onCancel={onClose}
                        ref={refSubmit}
                    >
                        {!confirm && <div className='d-row jc-between w-100'>

                            <Button variant="contained" className="mobile-hidden"
                                color="info" onClick={onChange}>
                                <Refresh />
                            </Button>

                            <Button variant="text"
                                className='button-btn'
                                color="primary"
                                onClick={confirmHandle}>
                                Spara & Verkställ
                            </Button>

                            <Button variant="text"
                                className='button-btn'
                                color="primary"
                                onClick={confirmHandle}>
                                Spara & Verkställ
                            </Button>

                        </div>}
                    </FormButtons>

                </DialogActions>
            </Dialog>

            {savePdf && <input type="file" className="none" value={PDFConverter(label, subLabel)}/>}
        </>
    );
}
export default ModalPreview;
