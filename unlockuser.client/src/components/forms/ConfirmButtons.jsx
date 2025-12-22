// installed
import { Button, Alert, AlertTitle } from '@mui/material';

function ConfirmButtons({ 
    question = "Säker?", 
    color = "error", 
    variant = "outlined", 
    disabled,
    onConfirm, 
    onCancel }) {

    const buttons = [
        {
            label: "Nej",
            props: { variant: "outlined", type: "reset", className: "bg-white", onClick: onCancel, color: "inherit" }
        },
        {
            label: "Ja",
            props: {
                ...
                { variant: "contained", color: color, className: "confirm-btn", type: onConfirm ? "button" : "submit" },
                ...(onConfirm ? { onClick: onConfirm } : null)
            }
        }
    ];
    return (
        <Alert 
            icon={false} 
            severity={color} 
            variant={variant}
            className={`form-buttons d-row w-100 fade-in`} 
            style={{marginTop: "10px !important"}}
            id="confirm-buttons" 
            action={buttons.map((b, ind) => {
                    return <Button key={ind} {...b.props} disabled={disabled} sx={{marginRight: "10px"}}>{b.label}</Button>
                })}>
            <AlertTitle color={color} className="confirm-question">{question}</AlertTitle>
        </Alert>
    )
}

export default ConfirmButtons
