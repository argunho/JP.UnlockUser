import { useState } from 'react';

// Installed
import { Close } from "@mui/icons-material";

import {
    Button, Dialog, DialogActions, IconButton, DialogContent, DialogContentText, DialogTitle
} from "@mui/material";
import { HelpOutline } from '@mui/icons-material';

// Components
import ListView from "../lists/ListView";


function ModalView({ children, label, content }) {
    const [open, setOpen] = useState(false);

    function onClick() {
        setOpen(open => !open);
    }

    const  isArray = Array.isArray(content);

    return (
        <>
            <IconButton
                color="primary"
                className="modal-help-btn"
                onClick={onClick}>
                <HelpOutline />
            </IconButton>

            <Dialog
                open={open}
                onClose={onClick}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                sx={{
                    zIndex: 3000
                }}
                className="modal-view"
            >
                <DialogTitle 
                id="alert-dialog-title" 
                color="-moz-initial">
                    {label}
                </DialogTitle>
                <DialogContent sx={{ overflow: isArray && content?.length == 1 ? "visible" : "auto"}}>
                    {children}

                    {!children && <>
                        {/* If content is text */}
                        {!isArray && <DialogContentText id="alert-dialog-description" sx={{ margin: "10px 15px 0 15px" }}>
                            <span dangerouslySetInnerHTML={{ __html: content }}></span>
                        </DialogContentText>}

                        {/* If content is an array data */}
                        {isArray && <ListView list={content} />}
                    </>}
                </DialogContent>
                <DialogActions className="jc-between" >
                    {/* Close modal */}
                    <Button onClick={onClick} color="error">
                        <Close fontSize="small" />
                    </Button>
                </DialogActions>
            </Dialog>
        </>

    )
}

export default ModalView;