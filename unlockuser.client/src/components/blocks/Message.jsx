// Installed
import { useState } from "react";
import { Alert } from "@mui/material";

// start: 2026-08-31 09:41
// Closing is self-contained state, not a ref-based DOM mutation: mutating
// ref.current.style directly bypasses React and gets lost/overridden on re-render.
function Message({ res, cancel, styles }) {

    const [closed, setClosed] = useState(false);

    const error = typeof res === "string" ? res : res?.error;
    const msg = res === 0 || res?.msg === "0" ? "Inget data finns att visa ..." : (error ? res.error : res?.msg);
    const color = res == 0 ? "warning" : (error ? "error" : (res?.color ?? "success"));

    let props = cancel ? { onClose: () => cancel(msg || error) } : { onClose: () => setClosed(true) };

    if (typeof msg === "boolean" || closed)
        return null;
    // end


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