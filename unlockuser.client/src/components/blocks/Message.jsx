import { useEffect, useRef } from 'react';

// Installed
import { Alert } from "@mui/material";

function Message({ res, cancel, ref, message, styles }) {

    const refMessage = useRef(null);

    useEffect(() => {
        if (message) return;

        if (ref && ref?.current)
            ref.current?.scrollIntoView();
        else
            refMessage.current?.scrollIntoView();

    }, [res, message])


    const error = typeof res === "string" ? res : res?.error;
    const msg = res === 0 || res?.msg === "0" ? "Inget data finns att visa..." : (error ? res.error : res?.msg);
    const color = res == 0 ? "warning" : (error ? "error" : (res?.color ?? "success"));

    let props = cancel || ref ? { onClose: () => ref ? ref.current.className = "none" : cancel(msg || error) } : {};

    if (typeof msg === "boolean")
        return null;


    return <Alert color={color}
            variant="standard"
            severity={color}
            className="message-box d-row w-100"
            style={styles}
            {...props}
            ref={ref ?? refMessage}>

            <p className="res-message w-100" dangerouslySetInnerHTML={{ __html: msg.replaceAll("\n", "<br/>").replaceAll("\n\r", "<br/>") }}></p>
        </Alert>
}

export default Message;