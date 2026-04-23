export function ErrorHandle(error) {

    const errorResponse = {
        color: "error",
        msg: "Något har gått snett.<br/>Fel: "
    }

    if (error?.result) {
        console.error("error result", error?.result)
        return error?.result;
    } else if (error?.code === "ERR_BAD_RESPONSE") {
        console.error("error bad response", error.message)
        errorResponse.msg += "Servern svarade inte som förväntat.";
        errorResponse.msg += error?.message ? ` (${error.message})` : "Okänd serverfel.";
        return errorResponse;
    }
    else if (error?.msg) {
        console.error("error msg", error?.msg)
        return error;
    }
    else if ((error?.response && error?.response?.status === 401) || error?.status === 401) {
        console.error("error 401")
        window.location.pathname = "/session/expired";
        return null;
    }
    else if (error?.code && error?.code === "ERR_CANCELED") {
        console.error("error canceled", error)
        errorResponse.msg = error?.message;
        return errorResponse;
    }
    else if (error?.response?.status === 400 || error?.status === 400) {
        console.error("error validation", error?.errors)
        Object.keys(error?.errors).forEach(key => {
            const err = error?.errors[key];
            console.log("error validation key", key, err)
            errorResponse.msg += Array.isArray(err) ? err.join("<br/>") : `${err}<br/>`;
        });
        return errorResponse;
    }
    else if (error?.response?.status !== undefined) {
        console.error("error response", error?.response?.data)
        return error?.response?.data;
    }
    else {
        console.error("error unknown", error)
        errorResponse.msg += typeof error === "object" ? error?.message : error;
        return errorResponse;
    }
}