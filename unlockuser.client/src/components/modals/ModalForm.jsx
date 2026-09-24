import { useState } from 'react';

// Installed
import { Close } from "@mui/icons-material";
import {
    IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, FormControl
} from "@mui/material";
import FormButtons from '../forms/FormButtons';

// Components


function ModalForm({ label, onSubmit, onClose }) {

    const [formData, setFormData] = useState({});

    function onChange(e) {
        const value = e.target.value;
        const name = e.target?.name;

        setFormData({
            ...formData,
            [name]: value
        })
    }
console.log(label)
    return <Dialog
        open={true}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        draggable={false}
        className='modal-wrapper print-page'
        id="preview-modal"
        sx={{
            zIndex: 3000
        }}
    >
        <DialogTitle
            id="alert-dialog-title"
            className="d-row jc-between modal-label"
            color="-moz-initial">
            {label}

            {/* Close modal */}
            <IconButton onClick={onClose} >
                <Close fontSize="small" />
            </IconButton>
        </DialogTitle>

        {/* start: 2026-09-24 */}
        {/* MUI removes top padding of DialogContent after DialogTitle, so the floating labels were clipped */}
        <DialogContent className="w-100 modal-content-wrapper">
        {/* end */}
            <FormControl fullWidth style={{ marginBottom: "30px" }}>
                <TextField
                    label="Titel"
                    required={true}
                    name="title"
                    placeholder="Tillägg till standardtiteln på ärendet (3–20 tecken)" // 2026-09-24
                    inputProps={{
                        minLength: 3,
                        maxlength: 20
                    }}
                    onChange={onChange}
                    className="field w-100"
                />
            </FormControl>

            <FormControl fullWidth style={{ marginBottom: "30px" }}>
                <TextField
                    label="Text"
                    required={true}
                    name="text"
                    // start: 2026-09-24
                    multiline
                    rows={10}
                    onChange={onChange}
                    // end
                    placeholder="Beskriv ärendet (minst 5 tecken)" // 2026-09-24
                    inputProps={{
                        minLength: 5
                    }}
                    className="field w-100"
                />
            </FormControl>

        </DialogContent>

        <DialogActions className="jc-between modal-actions" >
            <FormButtons confirmable={true} onSubmit={() => onSubmit(formData)}/>
        </DialogActions>
    </Dialog>
}

export default ModalForm;