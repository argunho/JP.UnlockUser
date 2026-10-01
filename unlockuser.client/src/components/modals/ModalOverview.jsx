// Installed
import { Dialog, DialogActions, DialogContent, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { DialogTitle } from '@mui/material';

function ModalOverview({ children, open = true, item, onClose }) {

    const closeButton = <IconButton onClick={onClose} className="close-btn">
        <Close />
    </IconButton>;

    return <Dialog open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className="modal-overview w-100"
        sx={{
            zIndex: 3000
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
                <span dangerouslySetInnerHTML={{ __html: item?.primary ?? "" }} />
                {children && closeButton}
            </div>
            {/* end */}
        </DialogTitle>


        <DialogContent className="modal-desc">
            <div dangerouslySetInnerHTML={{ __html: item?.secondary?.replaceAll("\n", "</br>") }} />
        </DialogContent>


        <DialogActions className="modal-actions">
            {children}
            {!children && closeButton}
        </DialogActions>
    </Dialog>
}

export default ModalOverview;
