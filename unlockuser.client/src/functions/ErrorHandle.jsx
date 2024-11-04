import { useNavigate } from "react-router-dom";
import { CancelRequest } from "../services/ApiRequest";

export function ErrorHandle(error) {
    
    const navigate = useNavigate();

    if (error?.response?.status === 401)
        navigate("/session/expired");
    else if(error.code === "ERR_CANCELED")
        CancelRequest();

    return {
        alert: "error",
        msg: `Något har gått snett.<br/>Fel: ${typeof error === "object" ? error?.message : error}`
    }
}