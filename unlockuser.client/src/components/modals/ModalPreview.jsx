
import { useRef, useState } from 'react';

// Installed
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, FormControlLabel, Checkbox } from '@mui/material';
import { Refresh } from '@mui/icons-material';

// Components
import Table from '../lists/Table';
import FormButtons from '../forms/FormButtons';


const checkboxes = [
    { label: "Skicka listan till email", name: "email", value: "email", color: "success" },
    { label: "Ladda ner listan", name: "download", value: "download", color: "primary" }
]

// Functions
function ModalPreview({ open = true, list, label, subLabel, onSubmit, onChange, onClose }) {

    const refPrint = useRef(null);

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

                <DialogActions className="no-print d-column buttons-wrapper">


                    {/* Checkboxes */}
                    <div className="d-row w-100 jc-end" style={{ margin: "10px 0" }}>
                        {checkboxes.map((box) => {
                            return <FormControlLabel
                                key={box.value}
                                {...box}
                                control={<Checkbox />}
                            />;
                        })}

                    </div>

                    <FormButtons
                        label="Verkställ"
                        swap={true}
                        confirmable={true}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                    >
                        <Button
                            variant="contained"
                            className="mobile-hidden"
                            color="info" 
                            onClick={onChange}>
                            <Refresh />
                        </Button>
                    </FormButtons>

                </DialogActions>
            </Dialog>

        </>
    );
}
export default ModalPreview;
