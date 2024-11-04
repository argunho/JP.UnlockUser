// Installed
import { Check, Close } from "@mui/icons-material";
import {
    Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from "@mui/material";

function ModalView({ children, open, msg = "Bekräftelse krävs", content = "Radera permanent?", error, link, color, buttonValue, closeButtonValue, clickHandle, close }) {

    return (
        <Dialog open={open}
            onClose={close}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            color={!error ? "inherit" : "error"}
            sx={{
                zIndex: 3000
            }}
            className="modal-view"
        >
            <DialogTitle id="alert-dialog-title" color={error ? "#cc0000" : "-moz-initial"}>
                <span dangerouslySetInnerHTML={{ __html: msg ?? (!error ? "Skickad!" : "Obs!") }}></span>
            </DialogTitle>
            <DialogContent>
                {!children ? <DialogContentText id="alert-dialog-description" sx={{ margin: "10px 15px 0 15px" }}>
                    {!!content ? <span dangerouslySetInnerHTML={{ __html: content }}></span> : <Check color="success" className="modal-svg" />}
                </DialogContentText> : children}
            </DialogContent>
            <DialogActions>
                {/* Additional action button */}
                {(!!buttonValue && (!error || !!link)) && <Button color={color ?? "error"} onClick={clickHandle}>{buttonValue}</Button>}

                {/* Close modal */}
                <Button onClick={() => close(error)} color={!!color ? "error" : "inherit"} autoFocus>
                    {(!!closeButtonValue && !error) ? closeButtonValue : <Close fontSize="small" />}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ModalView;