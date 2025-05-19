import { useEffect } from 'react';

// Installed
import { Alert } from "@mui/material";


function Response({ children, res, cancel, style }) {

    useEffect(() => {
        let timer = null;

        if (cancel) {
            timer = setTimeout(() => {
                cancel(res);
            }, 10000)
        }

        return () => {
            clearTimeout(timer);
        }
    }, [cancel])


    const error = typeof res === "string" ? res : res?.error;
    const msg = res == 0 ? "Inget data finns att visa..." : (error ? res.error : res?.msg);
    const color = res == 0 ? "warning" : (error ? "error" : (res?.color ?? "success"));

    let props =  cancel ? { onClose: () => cancel(!!msg || error) } : {};
    if(style)
        props.style = style;

    return <Alert color={color} variant="standard" severity={color} 
                className="response-box d-row w-100" {...props} id="response">
        {children}
        <p className={`response-message${children ? " combined" : ""}`} dangerouslySetInnerHTML={{ __html: msg }}></p>
    </Alert>
}

export default Response;