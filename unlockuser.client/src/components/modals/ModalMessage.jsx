
import { useRef } from 'react';

// Installed
import { Close } from "@mui/icons-material";
import {
    Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from "@mui/material";

function ModalMessage({ children, childrenButton, open = true, label, content, cls = null, onClose }) {

    const ref = useRef(null);

    function onClick() {
        if (onClose) {
            onClose();
        } else {
            ref.current?.classList.add("none");
        }
    }

    const clsModal = cls?.modal ? `modal-view ${cls?.modal}` : "modal-view"
    const clsLabel = cls?.label ? { className: cls?.label } : null;
    const clsActions = cls?.actions ? { className: cls?.actions } : null;
    
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
            className={clsModal}
        >

            <DialogTitle
                id="alert-dialog-title"
                {...clsLabel}>
                <span dangerouslySetInnerHTML={{ __html: label ?? "Obs!" }}></span>
            </DialogTitle>
            <DialogContent>
                <DialogContentText className="modal-content-div" id="alert-dialog-description" sx={{ margin: "10px 15px 0 15px" }}>
                    {(!childrenButton && children) || <span dangerouslySetInnerHTML={{ __html: content }}></span>}
                </DialogContentText>
            </DialogContent>
            <DialogActions {...clsActions}>
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