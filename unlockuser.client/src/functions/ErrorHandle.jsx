export function ErrorHandle(error, navigate) {

    if (error?.response?.status === 401)
        navigate("/session/expired");

    const msg =  (error.code === "ERR_CANCELED") ? error.message 
            : `Något har gått snett.<br/>Fel: ${typeof error === "object" ? error?.message : error}`;

    console.error(msg)

    return {
        alert: "error",
        msg: msg
    }
}