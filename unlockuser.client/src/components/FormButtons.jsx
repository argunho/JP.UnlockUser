
import { useEffect, useState } from "react";

// Installed
import { Button, CircularProgress } from "@mui/material";
import { Close } from "@mui/icons-material";


function FormButtons({ children, label, question, disabled, position, swap, confirmable, confirmOnly, loading, submit, cancel, required, data }) {
    FormButtons.displayName = "FormButtons";

    const [confirm, setConfirm] = useState(!!confirmOnly);
    const [delay, setDelay] = useState(!confirmable);

    useEffect(() => {
        if (loading) setConfirm(false);
    }, [loading])

    let buttons = [
        {
            label: question ?? "Skicka?", visible: confirm, props: { className: "confirm-question" }
        },
        {
            label: "Nej", visible: confirm,
            props: { variant: "outlined", className: "bg-white", onClick: () => confirmHandle(true), color: "inherit" }
        },
        {
            label: "Ja", visible: confirm,
            props: {
                ...{
                    variant: "contained", color: "error", disabled: delay,
                    type: !!submit ? "button" : "submit"
                }, ...(!!submit ? { onClick: onSubmit } : null)
            }
        },
        {
            label: <Close color="inherit" fontSize="medium" />, visible: (!confirm && !!cancel),
            props: { variant: "contained", color: "error", disabled: loading, onClick: cancel }
        },
        {
            label: (loading ? <CircularProgress size={18} color="inherit" /> : (label ?? "Skicka")), visible: !confirm,
            props: {
                ... {
                    variant: "outlined", className: "submit-btn", color: (loading ? "primary" : "inherit"),
                    disabled: (disabled || loading), type: !confirmable ? "button" : "submit"
                }, ...(!!confirmable ? { onClick:() => confirmHandle (false)} : null)
            }
        },
    ];

    if (swap)
        [buttons[3], buttons[4]] = [buttons[4], buttons[3]];

    function confirmHandle(cancelAction = false) {
        if (cancelAction) {
            cancel();
            return;
        }

        // The control over all fields to find any missed required field
        if (!!required && !!data) {
            let missedFields = [];
            required?.forEach(name => {
                if (data[name] === undefined || data[name] === null)
                    missedFields.push(name);
            })

            if (missedFields.length > 0 && !!cancel) {
                cancel(missedFields);
                return;
            }
        }

        setConfirm(!confirm);
        setTimeout(() => {
            setDelay(confirm);
        }, 100)
    }

    function onSubmit() {
        setConfirm(false);
        submit();
    }

    return (
        <div className={`form-buttons d-row jc-end ${!!position ? `position-${position}` : ""}`}>
            {children}
            <div className="d-row jc-end w-100">
                {buttons.filter(x => x.visible).map((b, ind) => {
                    return <Button key={ind} {...b.props}>{b.label}</Button>
                })}
            </div>
        </div>
    )
}

export default FormButtons;