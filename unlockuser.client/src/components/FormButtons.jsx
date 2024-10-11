
import { useEffect, useState } from "react";

// Installed
import { Button, CircularProgress } from "@mui/material";
import { Close } from "@mui/icons-material";


function FormButtons({ children, run, disabled, position, label, question, action, loading, confirmAction, reset }) {
    FormButtons.displayName = "FormButtons";

    const [confirm, setConfirm] = useState(!!action);
    const [delay, setDelay] = useState(!action);

    useEffect(() => {
        if (loading) setConfirm(false);
    }, [loading])


    function confirmHandle() {
        // The control over all fields to find any missed required field
        if (!!action && !!reset)
            reset();
        else {
            setConfirm(!confirm);
            setTimeout(() => {
                setDelay(confirm);
            }, 100)
        }
    }

    function onSubmit() {
        setConfirm(false);
        confirmAction();
    }

    const divClass = `form-buttons d-row jc-end ${!!position ? `position-${position}` : ""}`;

    /* If confirmation is not required or action already confirmed */
    let props = {
        variant: "outlined",
        className: "submit-btn",
        color: loading ? "primary" : "inherit",
        disabled: disabled || loading,
        type: !run ? "button" : "submit"
    }

    if (!run)
        props = { ...props, ... { onClick: confirmHandle } }

    const confirmProps = !!confirmAction ? { onClick: onSubmit, type: "button" } : { type: "submit" };

    // Confirm block
    if (confirm) {
        return (
            <div className={divClass}>
                <p className="confirm-question">{`${question ?? "Skicka"}?`}</p>
                <Button variant="outlined"
                    className="bg-white"
                    onClick={confirmHandle}
                    color="inherit">Nej</Button>

                <Button variant="contained"
                    className="bg-unset" 
                    {...confirmProps}
                    disabled={delay}
                    color="error">Ja</Button>
            </div>
        );
    }


    return (
        <div className={divClass}>

            {!!reset && <Button variant="contained" color="error" disabled={loading} onClick={reset} >
                <Close color="inherit" fontSize="medium" />
            </Button>}

            {/* Children block */}
            {children && children}

            <Button {...props}>
                {loading ? <CircularProgress size={18} color="inherit" /> : label ?? "Skicka"}
            </Button>
        </div>
    )
}

export default FormButtons;