// Installed
import { Alert } from "@mui/material";

function Message({ res, cancel, styles }) {

    const error = typeof res === "string" ? res : res?.error;
    const msg = res === 0 || res?.msg === "0" ? "Inget data finns att visa ..." : (error ? res.error : res?.msg);
    const color = res == 0 ? "warning" : (error ? "error" : (res?.color ?? "success"));

    let props = cancel ? { onClose: () => cancel(msg || error) } : {};

    if (typeof msg === "boolean")
        return null;


    return <Alert color={color}
            variant="standard"
            severity={color == "disabled" ? "info" : color}
            className={`message-box d-row w-100 ${color}`}
            style={styles}
            {...props}>

            <p className="res-message w-100" dangerouslySetInnerHTML={{ __html: msg?.replaceAll("\n", "<br/>").replaceAll("\n\r", "<br/>") }}></p>
        </Alert>
}

export default Message;