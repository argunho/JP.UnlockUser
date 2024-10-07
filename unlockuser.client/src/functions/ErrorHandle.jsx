export function ErrorHandle(error, navigate) {
    
    if (error?.response?.status === 401)
        navigate("/session/expired");

    return {
        error: true,
        msg: `Något har gått snett.<br/>Fel: ${typeof error === "object" ? error?.message : error}`
    }
}