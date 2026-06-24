
import { useRef } from 'react';

// Installed
import { Close } from "@mui/icons-material";
import {
    Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from "@mui/material";

function ModalMessage({ children, childrenButton, open = true, label, content, onClose }) {

    const ref = useRef(null);

    function onClick() {
        if (onClose) {
            onClose();
        } else {
            ref.current?.classList.add("none");
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            sx={{
                zIndex: 3000,
            }}
            ref={ref}
            className="modal-view"
        >

            <DialogTitle id="alert-dialog-title">
                <span dangerouslySetInnerHTML={{ __html: label ?? "Obs!" }}></span>
            </DialogTitle>
            <DialogContent>
                <DialogContentText className="modal-content-div" id="alert-dialog-description" sx={{ margin: "10px 15px 0 15px" }}>
                   {(!childrenButton && children) ||  <span dangerouslySetInnerHTML={{ __html: content }}></span>}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                {/* Child button */}
                {(childrenButton && children) && children}

                {/* Close modal */}
                <Button onClick={onClick} autoFocus color="error" >
                    <Close />
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ModalMessage;