export function ErrorHandle(error) {

    const errorResponse = {
        color: "error",
        msg: "Något har gått snett.<br/>Fel: "
    }

    if (error?.response && error?.response?.status === 401)
        window.location.pathname = "/session/expired";
    else if (error?.code && error?.code === "ERR_CANCELED")
        errorResponse.msg = error?.message;
    else
        errorResponse.msg += typeof error === "object" ? error?.message : error;

    return errorResponse;
}