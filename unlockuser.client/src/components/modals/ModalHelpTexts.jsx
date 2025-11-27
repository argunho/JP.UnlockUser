
import { useRef, useState } from 'react';

// Installed
import { AlertTitle, Checkbox, FormControlLabel, Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { HelpOutline, LiveHelpOutlined, Refresh } from '@mui/icons-material';

// Components
import Table from '../lists/Table';
import FormButtons from '../forms/FormButtons';

// Functions
function ModalHelpTexts({ children, open = true, data, cls = "situated-btn", isTable = false, isSubmit = false,
    isTitle, inverseFunction, regeneratePassword, view, ref }) {

    const [confirm, setConfirm] = useState(false);
    const [savePdf, setSavePdf] = useState(false);

    const keys = data.length > 0 ? Object.keys(data[0]) : [];
    const refPrint = useRef(null);

    // Confirm handle
    const confirmHandle = () => {
        setConfirm(true);
        setSavePdf(true);
    }

    // Close modal window
    const clickHandle = (submit) => {
        if (submit)
            inverseFunction(savePdf);

        close();
    }

    const handleMenuOpen = () => {
        setConfirm(false);
    }

    const handleMenuClose = () => {
        setConfirm(false);
    }

    const close = () => {
        setConfirm(false);
        setSavePdf(false);
    }

    return (
        <>
            {!view && <FormControlLabel
                className={`help-btn ${cls}`}
                control={<Checkbox size='small'
                    color="primary"
                    checked={open}
                    ref={ref}
                    icon={<HelpOutline />}
                    checkedIcon={<LiveHelpOutlined />}
                    onClick={() => open ? handleMenuClose() : handleMenuOpen()}
                    inputProps={{ 'aria-label': 'controlled', color: "primary" }} />}
                label="Hjälp" />}

            {/* Modal dialog window */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                aria-labelledby="dialog-title"
                draggable={false}
                className='modal-wrapper print-page'
                id="content"
                ref={refPrint}>

                <DialogTitle
                    style={{ cursor: 'move' }}
                    id="dialog-title"
                    dangerouslySetInnerHTML={{ __html: isTitle }}>
                </DialogTitle>

                {/* View this block if data is an array */}
                {Array.isArray(data) && <DialogContent style={{ marginBottom: "25px" }}>
                    {isTable ? <Table
                        name={isTitle}
                        names={["Namn", "Lösenord"]} list={data} /> // The table component is required to display the list of students and a list of generated passwords for them.
                        : data.map((a, i) => ( // Loop of help texts
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
                </DialogContent>}

                {/* View this block if datat is a text */}
                {!Array.isArray(data) && <DialogContent style={{ marginBottom: "25px" }}>
                    <div dangerouslySetInnerHTML={{ __html: data }}></div>
                </DialogContent>}

                {!children && <DialogActions className="no-print buttons-wrapper">

                    <FormButtons
                        label="Verkställ"
                        confirmable={true}
                        confirmOnly={confirm}
                        swap={true}
                        submit={() => clickHandle(confirm)}
                        cancel={close}
                    >
                        {(isSubmit && !confirm) && <div className='d-row jc-between w-100'>

                            <Button variant="contained" className="mobile-hidden"
                                color="info" onClick={() => regeneratePassword(true)}>
                                <Refresh />
                            </Button>

                            <Button variant="text"
                                className='button-btn'
                                color="primary"
                                onClick={confirmHandle}>
                                Spara & Verkställ</Button>

                        </div>}
                    </FormButtons>

                </DialogActions>}

                {(!!data && children) && <DialogActions className="no-print buttons-wrapper">{children}</DialogActions>}
            </Dialog>

        </>
    );
}
export default ModalHelpTexts;
