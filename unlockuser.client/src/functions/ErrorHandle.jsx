import { useNavigate } from 'react-router-dom';

export function ErrorHandle(error) {

    const navigate = useNavigate();

    if (error?.response?.status === 401){
        navigate("/session/expired");
        return null;
    }

    let errorMessage = "Något har gått snett.";
    if(error !== null)
        errorMessage += typeof error === "object" ? error?.message : error;

    console.error(errorMessage)

    return {
        color: "error",
        msg: errorMessage
    }
}