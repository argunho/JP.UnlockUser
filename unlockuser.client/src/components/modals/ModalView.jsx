// Installed
import { Close } from "@mui/icons-material";

import {
    Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from "@mui/material";
import ListView from "../lists/ListView";

function ModalView({ children, open = true, label, content, onClose }) {

    return (
        <Dialog open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            sx={{
                zIndex: 3000
            }}
            className="modal-view"
        >
            <DialogTitle id="alert-dialog-title" color="-moz-initial">
                {label}
            </DialogTitle>
            <DialogContent>
                {children}

                {!children && <>
                    {/* If content is text */}
                    {!Array.isArray(content) && <DialogContentText id="alert-dialog-description" sx={{ margin: "10px 15px 0 15px" }}>
                        <span dangerouslySetInnerHTML={{ __html: content }}></span>
                    </DialogContentText>}

                    {/* If content is an array data */}
                    {Array.isArray(content) && <ListView list={content} />}
                </>}
            </DialogContent>
            <DialogActions className="jc-between" >
                {/* Close modal */}
                <Button onClick={() => onClose()} color="error">
                    <Close fontSize="small" />
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ModalView;