// Installed
import {  Dialog, DialogActions, DialogContent, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

function ModalOverview({children, open = true, item, onClose }) {

    return <Dialog open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{
            zIndex: 3000
        }}
        className="modal-view w-100"
        id="modal-view"
    >
        <div id="alert-dialog-title" className="dialog-label">
            <h3 className="d-row jc-start" >
                {item?.primary}
            </h3>
        </div>

        <DialogContent>
            <div dangerouslySetInnerHTML={{ __html: item?.description }}/>
        </DialogContent>


        <DialogActions className="modal-actions">
            {children}
            <IconButton onClick={onClose}>
                <Close />
            </IconButton>
        </DialogActions>
    </Dialog>
}

export default ModalOverview;
