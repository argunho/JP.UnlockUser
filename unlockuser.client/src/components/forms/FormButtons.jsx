
import { useEffect, useState } from "react";

// Installed
import { Button, CircularProgress } from "@mui/material";
import { Close } from "@mui/icons-material";


function FormButtons({ children, label, disabled, swap, confirmable, loading, onSubmit, onCancel, ref }) {

    const [confirm, setConfirm] = useState(false);

    useEffect(() => {
        if (loading) setConfirm(false);
    }, [loading])


    function confirmHandle() {
        setConfirm((confirm) => !confirm);
        if(confirm && onSubmit)
            onSubmit();
    }

    let buttons = [
        {
            label: "Skicka?", visible: confirm, props: { className: "confirm-question" }
        },
        {
            label: "Nej",
            visible: confirm,
            props: { variant: "outlined", className: "bg-white", onClick: () => confirmHandle(), color: "inherit" }
        },
        {
            label: "Ja",
            visible: confirm,
            props: {
                ...{
                    variant: "contained", color: "error",
                    type: onSubmit ? "button" : "submit"
                }, ...(onSubmit ? { onClick: confirmHandle } : null)
            }
        },
        {
            label: <Close color="inherit" fontSize="medium" />,
            visible: (!confirm && !!onCancel),
            props: { variant: "contained", color: "error", disabled: loading, onClick: onCancel }
        },
        {
            label: (loading ? <CircularProgress size={18} color="inherit" /> : (label ?? "Skicka")),
            visible: !confirm,
            ref: ref,
            props: {
                ... {
                    variant: "outlined", className: "submit-btn", color: loading ? "primary" : "inherit",
                    disabled: (disabled || loading), type: (!!confirmable || (!confirmable && onSubmit)) ? "button" : "submit"
                },
                ...(!!confirmable ? { onClick: () => confirmHandle(false) } : ((!confirmable && onSubmit) ? { onClick: onSubmit }  : null))
            }
        },
    ];

    if (swap)
        [buttons[3], buttons[4]] = [buttons[4], buttons[3]];


    return (
        <div className={`form-buttons d-row w-100 ${children ? "jc-between" : "jc-end"}`}>
            {/* Children buttons */}
            {(!confirm && !!children) && children}

            {/* Default buttons */}
            <div className={`d-row jc-end ${children ? "w-mc" : "w-100"}`}>
                {buttons.filter(x => x.visible).map((b, ind) => {
                    return <Button key={ind} {...b.props} ref={b?.ref}>{b.label}</Button>
                })}
            </div>
        </div>
    )
}

export default FormButtons;