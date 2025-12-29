import { use, useEffect, useState } from "react";

// Installed
import {
    Button, Dialog, DialogActions, DialogContent, List, ListItem, ListItemText, IconButton, CircularProgress
} from '@mui/material';
import {
     Close, CheckBoxRounded, CheckBoxOutlineBlankOutlined, Dvr
} from '@mui/icons-material';

// Components
import QrCode from "../blocks/QrCode";
import BarCode from "../blocks/BarCode";
import ConfirmButtons from "../forms/ConfirmButtons";
import Select from "../lists/Select";

// Storage
import { FetchContext } from '../../storage/FetchContext';

function ModalOverview({ data: { itemFields, itemData }, open, close }) {

    const savedKeys = localStorage.getItem("keys");
    const [keys, setKeys] = useState(savedKeys && savedKeys !== "[]" ? JSON.parse(savedKeys) : []);
    const [qrValue, setQrValue] = useState("");
    const [confirm, setConfirm] = useState(false);

    const { pending, fetchData, updateResData } = use(FetchContext);

    useEffect(() => {
        localStorage.setItem("keys", JSON.stringify(keys))
        handleValue();
    }, [keys])


    function clickHandle(key) {
        if (keys.indexOf(key) > -1)
            setKeys(previous => previous.filter(x => x !== key));
        else
            setKeys(previous => [...previous, key]);
    }

    function handleValue() {
        var values = { ...itemFields };

        Object.keys(values).forEach(x => {
            if (keys.indexOf(x) == -1)
                delete values[x];
        })

        let value = "";
        if (keys.indexOf("id") > -1) {
            value = "Id: " + itemData?.name;
        }

        const valuesArray = Object.keys(values);
        valuesArray.forEach((key) => {
            if (value.length > 0)
                value += ", \n";

            value += `${key}: ${values[key]}`;
        })


        setQrValue(value);
    }

    async function registerOnTopDesk() {
        setConfirm(false)
        let postData = { ...itemFields };
        postData.id = itemData.id;
        postData.type_id = itemData.templateId;
        const res = await fetchData({ api: "topdesk", method: "post", data: postData, action: "return"});

        if (res != null) {
            updateResData(previous => {
                return {
                    ...previous,
                    itemData: res
                }
            })
            setKeys(Object.keys(itemFields));
        }
    }

    return <Dialog open={open}
        onClose={close}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{
            zIndex: 3000
        }}
        className="modal-view w-100"
        id="modal-view"
    >
        <div id="alert-dialog-title" className="dialog-label">
            <h3 className="d-row jc-start" title={`Registrerad: ${itemData?.date}`}>
                {itemData?.primary}
            </h3>
            {itemData?.name && <Button color="primary" variant="text" className="d-row jc-start" onClick={() => clickHandle("id")}
                startIcon={keys.indexOf("id") > -1 ? <CheckBoxRounded color="inherit" /> : <CheckBoxOutlineBlankOutlined />}>
                {itemData?.secondary}
            </Button>}
        </div>

        <DialogContent>
            <List className="d-row wrap">
                {Object.keys(itemFields).map((x, ind) => {
                    return <ListItem key={x} className={ind % 2 == 0 ? "w-100" : ""}
                        secondaryAction={itemData?.name && <IconButton className="checkbox-btn" onClick={() => clickHandle(x)}>
                            {keys.indexOf(x) > -1 ? <CheckBoxRounded color="primary" /> : <CheckBoxOutlineBlankOutlined />}
                        </IconButton>}>
                        <ListItemText className={`${itemData?.topDeskId ? "reg-color" : ""}`} primary={x} secondary={`- ${itemFields[x]}`} />
                    </ListItem>
                })}
            </List>

            {/* Print block */}
            {itemData?.name && <>
                {/* List of printers */}
                <Select api="templates/printers" label="Skrivare" storage="printers" />

                <div className="d-row wrap code-container">
                    {/* Qr value preview */}
                    <QrCode value={qrValue} />

                    {/* Barcode preview */}
                    <BarCode value={itemData.name} />
                </div>
            </>}
        </DialogContent>


        <DialogActions className="modal-actions">

            {/* Close modal */}
            {!confirm && <Button variant="outlined" color="error" onClick={close} id="close-modal-btn">
                <Close /></Button>}

            {/* Register item on TopDesk */}
            {(!itemData?.name && !confirm) && <Button
                id="reg-btn"
                variant="contained"
                color="warning"
                name="register"
                onClick={() => setConfirm((previous) => !previous)}
                autoFocus
                disabled={pending}
                endIcon={pending ? <CircularProgress size={30} color="warning" /> : <Dvr />} >
                Registrera i TopDesk
            </Button>}

            {/* Confirm actions block */}
            {confirm && <ConfirmButtons
                question="Skicka?"
                onConfirm={registerOnTopDesk}
                onReject={() => setConfirm((previous) => !previous)} />}
        </DialogActions>
    </Dialog>
}

export default ModalOverview;


// const printContent = contentRef.current;
// const printWindow = window.open('', '', 'width=800,height=600');
// printWindow.document.write(`<html><head><title>${item?.primary}: ${item?.name}</title></head>
//     <body>${printContent.innerHTML}</body></html>`);
// printWindow.document.close();
// printWindow.print();