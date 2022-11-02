import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';
import { AlertTitle, Checkbox, FormControlLabel } from '@mui/material';
import { Close, HelpOutline, LiveHelpOutlined, Refresh } from '@mui/icons-material';
import Table from './Table';


function PaperComponent(props) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
            cancel={'[class*="MuiDialogContent-root"]'}>
            <Paper {...props} />
        </Draggable>
    );
}

function ModalHelpTexts({ arr, cls = " situated-btn", isTable = false, isSubmit = false,
    isTitle, inverseFunction, regeneratePassword }, ref) {

    const [open, setOpen] = React.useState(false);
    const [confirm, setConfirm] = React.useState(false);
    const [savePdf, setSavePdf] = React.useState(false);

    const keys = arr.length > 0 ? Object.keys(arr[0]) : [];
    const refPrint = React.useRef(null);

    // Confirm handle
    const confirmHandle = (save) => {
        console.log(save);
        setConfirm(true);
        setSavePdf(save);
    }

    // Close modal window
    const clickHandle = (submit) => {
        if (submit)
            inverseFunction(savePdf);

        setConfirm(false);
        setSavePdf(false);
        setOpen(false);
    }

    return (
        <>
            <FormControlLabel
                className={'help-btn' + cls}
                control={<Checkbox size='small'
                    color="primary"
                    checked={open}
                    ref={ref}
                    icon={<HelpOutline />}
                    checkedIcon={<LiveHelpOutlined />}
                    onClick={() => setOpen(true)}
                    inputProps={{ 'aria-label': 'controlled', color: "primary" }} />}
                label="Hjälp" />

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                PaperComponent={PaperComponent}
                aria-labelledby="draggable-dialog-title"
                className='modal-wrapper print-page' id="content"
                ref={refPrint}>

                <DialogTitle
                    style={{ cursor: 'move' }}
                    id="draggable-dialog-title"
                    dangerouslySetInnerHTML={{ __html: isTitle }}>
                </DialogTitle>

                <DialogContent style={{ marginBottom: "25px" }}>
                    {isTable ? <Table
                        name={isTitle}
                        names={["Namn", "Lösenord"]} list={arr} /> // The table component is required to display the list of students and a list of generated passwords for them.
                        : arr.map((a, i) => ( // Loop of help texts
                            <div key={i} className="modal_content">
                                <AlertTitle style={{ fontWeight: 600 }}>
                                    <span style={{ color: (a?.color ? a.color : "#000") }}>{a[keys[0]]}</span>
                                </AlertTitle>

                                {!Array.isArray(a[keys[1]]) && <div dangerouslySetInnerHTML={{ __html: a[keys[1]] }}></div>}
                                {Array.isArray(a[keys[1]]) && a[keys[1]].map((x, ind) => (
                                    <div key={ind} dangerouslySetInnerHTML={{ __html: x }}></div>
                                ))}
                            </div>
                        ))}
                </DialogContent>

                <DialogActions className="no-print modal-buttons-wrapper">
                    {(isSubmit && !confirm) &&
                        <>
                            <Button variant="text"
                                className='button-btn'
                                color="primary"
                                onClick={() => confirmHandle(true)}>
                                Spara & Verkställ</Button>

                            <Button variant="outlined"
                                className='button-btn'
                                color="primary"
                                onClick={() => confirmHandle(false)}>
                                Verkställ</Button>

                            <Button variant="contained" className="mobile-hidden"
                                color="info" onClick={() => regeneratePassword(true)}>
                                <Refresh />
                            </Button>
                        </>}

                    {!confirm && <Button variant='contained' color="error" autoFocus onClick={() => setOpen(false)}>
                        <Close />
                    </Button>}

                    {/* Confirm actions block */}
                    {confirm && <>
                        <p className='confirm-title'>Är du säker att du vill göra det?</p>
                        <Button className='button-btn button-action' onClick={() => clickHandle(true)} variant='contained' color="error">Ja</Button>
                        <Button className='button-btn button-action' variant='contained' color="primary" autoFocus onClick={() => clickHandle(false)}>Nej</Button>
                    </>}
                </DialogActions>
            </Dialog>

        </>
    );
}

const refModal = React.forwardRef(ModalHelpTexts);
export default refModal;
