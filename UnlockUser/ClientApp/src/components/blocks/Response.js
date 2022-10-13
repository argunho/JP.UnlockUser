import React, { useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import axios from 'axios';
import { useHistory } from 'react-router-dom';

export default function Response(props) {

    const [supportLink, setSupportLink] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [response, setResponse] = useState(props?.noAccess ? {
        msg: "Åtkomst nekad! Dina atkomstbehörigheter måste kontrolleras på nytt.",
        alert: "error"
    } : props.response)
    const occurredError = sessionStorage.getItem("occurredError") || null;
    const error = response?.errorMessage ?? null;

    const history = useHistory();

    useEffect(() => {
        if (props?.noAccess && !props?.response)
            setTimeout(() => { history.push("/"); }, 5000);
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Send a message to the system developer about the occurred error
    const sendMsgToSupport = async () => {
        setSupportLink(false);
        var model = {
            link: window.location.href,
            error: error
        }
        setResponse({
            alert: "success",
            msg: "Tack för ditt meddelande!"
        })
        sessionStorage.removeItem("occuredError");
        await axios.post("user/contact/error", model)
            .then(res => {
                if (res.data.errorMessage)
                    console.log(res.data.errorMessage)
                setTimeout(() => {
                    props.reset();
                }, 1000)
            }, error => {
                console.log(error);
                props.reset();
            })
    }

    // Activate a button in the user interface for sending an error message to the system developer if the same error is repeated more than two times during the same session    
    useEffect(() => {
        if (error && response?.repeatedError && response?.repeatedError >= 3) {
            if (occurredError && occurredError === error) {
                setTimeout(() => {
                    setResponse({ alert: "error", msg: "Något har gått snett." })
                    setSupportLink(true);
                }, 100)
                sessionStorage.removeItem("occurredError");
            } else
                sessionStorage.setItem("occurredError", error);
        } else if (response?.timeLeft) //If login is blocked temporarily and lock time is not passed out 
            getTimeLeftToUnblock();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [response?.errorMessage])

    // The timer with countdown, a view of the time left to unblock login
    const getTimeLeftToUnblock = () => {
        if (!response?.timeLeft) return;

        const num = (timeLeft ? timeLeft : response?.timeLeft).split(":");
        let sec = parseInt(num[2]);
        let min = parseInt(num[1]);

        setInterval(() => {
            if (sec + min === 0 || response === null) {
                clearInterval();
                props.reset();
            } else {
                if (sec === 0) {
                    if (min > 0) min -= 1;
                    else min = 59;
                    sec = 59;
                } else
                    sec -= 1;
            }

            setTimeLeft(`00:${(min < 10) ? "0" + min : min}:${(sec < 10) ? "0" + sec : sec}`)
        }, 1000)
    }

    return <Alert className='alert' severity={response?.alert} onClose={() => ((!props.noAccess && props.reset) ? props.reset() : {})}>
        <span dangerouslySetInnerHTML={{ __html: (timeLeft ? response?.msg.replace(response?.timeLeft, timeLeft) : response?.msg) }}></span>
        {supportLink && <Button variant="contained"
            color='error'
            style={{ display: "block", marginTop: "20px" }}
            onClick={() => sendMsgToSupport()}>
            Meddela systemadministratör
        </Button>}
    </Alert>;
}
