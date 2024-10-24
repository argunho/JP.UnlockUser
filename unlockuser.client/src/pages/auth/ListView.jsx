import { useEffect, useState } from "react";

// Installed
import { Button, CircularProgress, Collapse, IconButton, List, ListItem, ListItemIcon, ListItemText, TextField } from "@mui/material";
import { Delete } from "@mui/icons-material";

// Components
import FormButtons from "../../components/FormButtons";

// Services
import ApiRequest from "../../services/ApiRequest";
import Response from "../../components/Response";
import Loading from "../../components/Loading";

// Functions
import { ErrorHandle } from "../../functions/ErrorHandle";

function ListView({ authContext, label, api, id, fields, labels, navigate }) {
    ListView.displayName = "Schools";

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const [visibleForm, setVisibleForm] = useState(false);
    const [response, setResponse] = useState(null);
    const [item, setItem] = useState(fields);
    const [required, setRequired] = useState([]);

    useEffect(() => {
        async function getList() {
            await ApiRequest(api).then(res => {
                setList(res.data);
                setLoading(false);
                if (res.data?.length == 0) {
                    setResponse({
                        alert: "info",
                        msg: "Ingen data att visa ..."
                    })
                } else 
                    authContext.updateSchools(res.data);
            })
        }
        getList();
    }, [])

    useEffect(() => {
        authContext.updateSchools(list);
    }, [list])

    function onChange(e) {
        setRequired([]);
        setItem({ ...item, [e.target.name]: e.target.value });
    }

    function confirmHandle(item) {
        setOpen(!open);
        setItem(item)
        if (!confirm)
            setConfirm(item);
        else {
            setTimeout(() => {
                setConfirm(null);
            }, 300)
        }
    }

    function formHandle() {
        setOpen(!open);
        setItem(fields);
        if (!visibleForm)
            setVisibleForm(true);
        else {
            setTimeout(() => {
                setVisibleForm(false);
            }, 300)
        }
    }

    async function removeItem() {
        setOpen(false);

        await ApiRequest(`${api}/${item[id]}`, "delete").then(res => {
            if (res.status == 200 && !res.data) {
                const index = list.findIndex(x => x === item);
                setTimeout(() => {
                    setList(list.filter((x, ind) => ind !== index));
                }, 100)
            } else
                setResponse({ alert: "error", msg: res.data })

            setConfirm(null);
            setItem(fields);
        }, error => setResponse(ErrorHandle(error, navigate)))
    }

    async function onSubmit(e) {
        e.preventDefault();

        let emptyFields = [];

        Object.keys(item).map(name => {
            if (item[name]?.length < 3)
                emptyFields.push(name);
        });

        if (emptyFields.length > 0) {
            setRequired(emptyFields);
            return;
        }

        setLoading(true);
        await ApiRequest(`${api}`, "post", item).then(res => {
            if (res.status == 200 && !res.data)
                setList(list => [...list, item]);
            else
                setResponse({ alert: "error", msg: res.data })

            setLoading(false);
            formHandle();
        }, error => {
            setResponse(ErrorHandle(error, navigate));
            formHandle();
        })
    }

    return (
        <div className='interior-div view-list'>

            {/* Result list */}
            <List className="d-row list-container">
                {/* Actions/Info */}
                <ListItem className='view-list-result' secondaryAction={!!fields
                    && <Button size='large' style={{ minWidth: "120px" }} variant='outlined' color={visibleForm ? "error" : "primary"} disabled={loading} onClick={formHandle}>
                        {visibleForm ? "Avryt" : "Lägg till ny"}
                    </Button>}>
                    <ListItemText primary={label} secondary={loading ? "Data hämtning pågå ..." : `Antal: ${list?.length}`} />
                </ListItem>

                {/* Response */}
                {!!response && <Response response={response} reset={() => setResponse(null)} />}

                {/* Confirm/Form block */}
                {!!fields && <Collapse in={open} className='d-row' timeout="auto" unmountOnExit>
                    {/* Confirm */}
                    {!!confirm && <FormButtons action={confirm} question="Radera" confirmAction={removeItem} reset={() => setConfirm(null)} />}

                    {/* Form */}
                    {!!visibleForm && <form className='d-row view-list-form w-100' onSubmit={onSubmit}>
                        {Object.keys(fields)?.map((name, i) => {
                            return <TextField key={i} fullWidth name={name} label={labels[i]} value={item[name]}
                                onChange={onChange} disabled={loading} error={required.indexOf(name) > -1} />
                        })}

                        <Button variant="outlined" type="submit" className="form-button" disabled={loading}>
                            {loading ? <CircularProgress size={20} /> : "Spara"}
                        </Button>
                    </form>}
                </Collapse>}

                {/* Loop of result list */}
                {(list?.length > 0 && !loading) && list?.map((item, index) => {
                    return <ListItem key={index} className={`list-item${((index + 1) === list?.length && ((index + 1) % 2) !== 0) ? " w-100 last" : ""}`}
                        secondaryAction={!!fields && <IconButton onClick={() => confirmHandle(item)} color="error" disabled={!!confirm || visibleForm}>
                            <Delete /></IconButton>}>
                        <ListItemIcon>
                            {index + 1}
                        </ListItemIcon>
                        <ListItemText primary={item?.primary} secondary={item?.secondary} />
                    </ListItem>
                })}

                {/* Loading symbol */}
                {(loading && !open) && <Loading msg="data hämtas ..." />}
            </List>
        </div>
    )
}

export default ListView