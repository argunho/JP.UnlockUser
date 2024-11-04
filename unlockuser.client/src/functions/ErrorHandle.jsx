export function ErrorHandle(error, navigate) {

    if (error?.response?.status === 401)
        navigate("/session/expired");

    return {
        alert: "error",
        msg: (error.code === "ERR_CANCELED") ? error.message 
            : `Något har gått snett.<br/>Fel: ${typeof error === "object" ? error?.message : error}`
    }
}