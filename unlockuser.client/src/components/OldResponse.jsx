import { useEffect } from 'react';

// Installed
import { Alert } from '@mui/material';

// Css
import './../assets/css/response.css';

function Response({ children, res, reset }) {

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!!reset)
                reset();
        }, 5000)

        return () => {
            clearInterval(timer);
        }
    }, [reset])

    const str = typeof res === "string";
    const error = str || res?.error;
    const msg = str ? str : res?.msg;
    const color = error ? "error" : (res?.alert ?? "success");

    return <div className="response-box d-column w-100">

        {/* Message */}
        <Alert color={color} variant="standard" severity={color} className="d-row w-100" onClose={reset}>
            <p className="response-message w-100" dangerouslySetInnerHTML={{ __html: msg ?? "Skickad!" }}></p>
        </Alert>

        {(!error && !!children) && children}
    </div>
}

export default Response;