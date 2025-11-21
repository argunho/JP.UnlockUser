
import { useEffect } from 'react';

// Installed
import { Check, Close } from "@mui/icons-material";
import {
    IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from "@mui/material";
// import Confetti from 'react-confetti';

function ModalSuccess({ open = true, msg, close }) {

    useEffect(() => {
        let timer = setTimeout(() => {
            close();
        }, 5000)

        return () => {
            clearTimeout(timer);
        }
    }, [])


    return (
        <Dialog open={open}
            onClose={close}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            sx={{
                zIndex: 3000
            }}
            className="modal-view modal-block w-100"
            id="success-modal"
        >
            {/* Show confetti */}
            {/* <Confetti width="530px" height="290px" /> */}

            <DialogTitle id="alert-dialog-title">
                {msg ?? "Nu är det klart!"}
            </DialogTitle>

            <DialogContent>
                <DialogContentText id="alert-dialog-description" sx={{ margin: "10px 15px 0 15px" }}>
                    <Check color="success" className="modal-svg" />
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                {/* Close modal */}
                <IconButton onClick={close} color="inherit" autoFocus>
                    <Close fontSize="small" />
                </IconButton>
            </DialogActions>
        </Dialog>
    )
}

export default ModalSuccess;
