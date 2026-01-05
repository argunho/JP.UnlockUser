
// Installed
import {
    Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from "@mui/material";


function ModalConfirm({ open = true, msg, content, onConfirm, onClose }) {

    return (
        <Dialog open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            sx={{
                zIndex: 3000
            }}
            className="modal-view modal-block w-100"
            id="modal-confirm"
        >
            <DialogTitle id="alert-dialog-title" color="-moz-initial">
                <span dangerouslySetInnerHTML={{ __html: msg ?? "Bekräftelse krävs" }}></span>
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description" sx={{ margin: "10px 15px 0 15px" }}>
                    <span dangerouslySetInnerHTML={{ __html: content ?? "Fortsätta?"}}></span>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                {/* Confirm button */}
                <Button color="error" onClick={onConfirm}>Ja</Button>

                {/* Close modal */}
                <Button variant="contained" color="primary" onClick={onClose} autoFocus>
                    Nej
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ModalConfirm;