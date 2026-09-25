import { useState, use } from 'react';

// Installed
import { Close } from "@mui/icons-material";
import {
    IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, FormControl
} from "@mui/material";
import FormButtons from '../forms/FormButtons';
import { FetchContext } from '../../storage/FetchContext';

// Components


function ModalCaseForm({ props, label, required, api, onClose }) {

    const [formData, setFormData] = useState({});

    const { fetchData } = use(FetchContext);

    function onChange(e) {
        const value = e.target.value;
        const name = e.target?.name;

        setFormData({
            ...formData,
            [name]: value
        })
    }

    async function onSubmit() {
        const param = api ? api : "";
        onClose();
        const data = {
            ...props,
            ...formData
        };
        console.log(data, `topdesk/case/${param}`)

        await fetchData({ api: `topdesk/case/${param}`, method: "post", data: data, action: "success" });
    }

    const textLgh = required ? 50 : 5;

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
            <FormControl fullWidth style={{ marginBottom: "10px" }}>
                <TextField
                    label="Titel"
                    name="title"
                    placeholder="Tillägg till standardtiteln på ärendet (3–50 tecken)" // 2026-09-24
                    inputProps={{
                        minLength: 3,
                        maxlength: 50
                    }}
                    required={required}
                    className="field w-100"
                    onChange={onChange}
                    error={formData?.title?.length > 50}
                    helperText={`${formData?.title?.length ?? 0}/50`}
                />
            </FormControl>

            <FormControl fullWidth style={{ marginBottom: 0 }}>
                <TextField
                    label="Text"
                    name="text"
                    // start: 2026-09-24
                    multiline
                    rows={10}
                    // end
                    placeholder={`Beskriv ärendet (minst ${textLgh} tecken)`} // 2026-09-24
                    inputProps={{
                        minLength: textLgh
                    }}
                    required={required}
                    className="field w-100"
                    onChange={onChange}   
                    error={formData?.text?.length > 0 && textLgh > formData?.text?.length}                
                    helperText={`${formData?.text?.length ?? 0}/${textLgh}`}
                />
            </FormControl>

        </DialogContent>

        <DialogActions className="jc-between modal-actions" >
            <FormButtons confirmable={true} onSubmit={onSubmit} />
        </DialogActions>
    </Dialog>
}

export default ModalCaseForm;