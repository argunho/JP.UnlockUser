
import { useEffect, useState } from "react";

// Installed
import { Button, CircularProgress } from "@mui/material";
import { Close } from "@mui/icons-material";


function FormButtons({ children, label, question, disabled, position, swap, confirmable,
    confirmOnly, variant, loading, submit, cancel, cancelDisabled, required, data }) {
    FormButtons.displayName = "FormButtons";

    const [confirm, setConfirm] = useState(false);
    const [delay, setDelay] = useState(!confirmable);

    useEffect(() => {
        if (loading) setConfirm(false);
    }, [loading])

    useEffect(() => {
        setConfirm(!!confirmOnly);
    }, [confirmOnly])

    let buttons = [
        {
            label: question ?? "Skicka?", visible: confirm, props: { className: "confirm-question" }
        },
        {
            label: "Nej",
            visible: confirm,
            props: { variant: "outlined", className: "bg-white", onClick: () => confirmHandle(true), color: "inherit" }
        },
        {
            label: "Ja",
            visible: confirm,
            props: {
                ...{
                    variant: "contained", color: "error", disabled: delay,
                    type: submit ? "button" : "submit"
                }, ...(submit ? { onClick: onSubmit } : null)
            }
        },
        {
            label: <Close color="inherit" fontSize="medium" />,
            visible: (!confirm && !!cancel),
            props: { variant: loading || cancelDisabled ? "outlined" : "contained", color: "error", disabled: loading || cancelDisabled, onClick: cancel }
        },
        {
            label: (loading ? <CircularProgress size={18} color="inherit" /> : (label ?? "Skicka")),
            visible: !confirm,
            props: {
                ... {
                    variant: (loading || disabled) ? "outlined" : (variant ?? "outlined"), className: "submit-btn", color: ((loading || !!variant) ? "primary" : "inherit"),
                    disabled: (disabled || loading), type: (!!confirmable || (!confirmable && submit)) ? "button" : "submit"
                },
                ...(!!confirmable ? { onClick: () => confirmHandle(false) } : ((!confirmable && submit) ? { onClick: onSubmit }  : null))
            }
        },
    ];

    if (swap)
        [buttons[3], buttons[4]] = [buttons[4], buttons[3]];

    function confirmHandle(cancelAction = false) {
        if (cancelAction) {
            cancel();
            setConfirm(false);
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

        setConfirm((confirm) => !confirm);
        setTimeout(() => {
            setDelay(confirm);
        }, 100)
    }

    function onSubmit() {
        setConfirm(false);
        submit();
    }

    return (
        <div className={`form-buttons d-row w-100 ${children ? "jc-between" : "jc-end"} ${!!position ? `position-${position}` : ""}`}>
            {/* Children buttons */}
            {(!confirm && !!children) && children}

            {/* Default buttons */}
            <div className={`d-row jc-end ${children ? "w-mc" : "w-100"}`}>
                {buttons.filter(x => x.visible).map((b, ind) => {
                    return <Button key={ind} {...b.props}>{b.label}</Button>
                })}
            </div>
        </div>
    )
}

export default FormButtons;