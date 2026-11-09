// Installed
import { Dialog, DialogContent, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { DialogTitle } from '@mui/material';


function ModalOverview({ children, open = true, label, onClose }) {

    const closeButton = <IconButton onClick={onClose} className="close-btn no-margin">
        <Close />
    </IconButton>;

    return <Dialog open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className="modal-form w-100"
        sx={{
            zIndex: 3000,
        }}
        id="modal-view"
    >

        <DialogTitle
            id="dialog-title"
            className="modal-label"
            sx={{
                marginBottom: "20px",
                backgroundColor: "var(--color-primary)",
                color: "#FFFFFF"
            }}>
            {/* start: 2026-10-01 */}
            <div className="d-row jc-between ai-center">
                <span dangerouslySetInnerHTML={{ __html: label ?? "" }} />
                {closeButton}
            </div>
            {/* end */}
        </DialogTitle>


        <DialogContent className="d-column">
            {children}
        </DialogContent>
    </Dialog>
}

export default ModalOverview;