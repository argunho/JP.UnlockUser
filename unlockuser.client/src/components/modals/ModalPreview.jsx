
import { useRef, useState } from 'react';

// Installed
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';

// Components
import Table from '../lists/Table';
import FormButtons from '../forms/FormButtons';

// Functions
function ModalPreview({ open = true, data, label, inverseFunction, onChange, onClose }) {

    const [confirm, setConfirm] = useState(false);
    const [savePdf, setSavePdf] = useState(false);

    const refPrint = useRef(null);

    // Confirm handle
    const confirmHandle = () => {
        setConfirm(true);
        setSavePdf(true);
    }

    // Close modal window
    const clickHandle = (submit) => {
        if (submit)
            inverseFunction(savePdf);

        close();
    }

    const close = () => {
        setConfirm(false);
        setSavePdf(false);
    }

    return (
        <>
            {/* Modal dialog window */}
            <Dialog
                open={open}
                onClose={onClose}
                aria-labelledby="dialog-title"
                draggable={false}
                className='modal-wrapper print-page'
                id="content"
                ref={refPrint}>

                <DialogTitle
                    style={{ cursor: 'move' }}
                    id="dialog-title"
                    dangerouslySetInnerHTML={{ __html: label }}>
                </DialogTitle>

                {/* View this block if data is an array */}
              <DialogContent style={{ marginBottom: "25px" }}>
                    {/* The table component is required to display the list of students and a list of generated passwords for them. */}
                    <Table
                        name={label}
                        names={["Namn", "Användarnamn", "Lösenord"]} list={data} /> 
                </DialogContent>

                <DialogActions className="no-print buttons-wrapper">

                    <FormButtons
                        label="Verkställ"
                        confirmable={true}
                        confirmOnly={confirm}
                        swap={true}
                        submit={() => clickHandle(confirm)}
                        onCancel={close}
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
                                Spara & Verkställ</Button>

                        </div>}
                    </FormButtons>

                </DialogActions>
            </Dialog>

        </>
    );
}
export default ModalPreview;
