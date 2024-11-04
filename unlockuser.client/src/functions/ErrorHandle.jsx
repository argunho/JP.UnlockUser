import { useNavigate } from "react-router-dom";

export function ErrorHandle(error) {
    
    const navigate = useNavigate();
    
    if (error?.response?.status === 401)
        navigate("/session/expired");

    return {
        alert: "error",
        msg: `Något har gått snett.<br/>Fel: ${typeof error === "object" ? error?.message : error}`
    }
}