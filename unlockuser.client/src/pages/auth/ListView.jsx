import { useEffect, useState } from "react";
import _ from "lodash";

// Installed
import { Button, CircularProgress, Collapse, IconButton, List, ListItem, ListItemIcon, ListItemText, TextField } from "@mui/material";
import { ArrowDropDown, ArrowDropUp, CalendarMonth, Delete } from "@mui/icons-material";

// Components
import FormButtons from "../../components/FormButtons";

// Services
import ApiRequest from "../../services/ApiRequest";
import Response from "../../components/Response";
import Loading from "../../components/Loading";

// Functions
import { ErrorHandle } from "../../functions/ErrorHandle";

function ListView({ loc, includedList, label, fullWidth, api, id, fields, labels, navigate }) {
    ListView.displayName = "Schools";

    const [list, setList] = useState(includedList ?? []);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const [visibleForm, setVisibleForm] = useState(false);
    const [response, setResponse] = useState(null);
    const [viewCount, setViewCount] = useState();
    const [item, setItem] = useState(fields);
    const [required, setRequired] = useState([]);
    const [collapsedItemIndex, setCollapsedItemIndex] = useState(null);

    const empty = {
        alert: "info",
        msg: "Ingen data att visa ..."
    };

    useEffect(() => {
        setResponse();
        if (!!api)
            getList();
        else {
            if (list.length === 0)
                setResponse(empty);
            setLoading(false);
            setList(includedList);
        }
    }, [loc])

    async function getList() {
        await ApiRequest(api).then(res => {
            const { list, count } = res.data;
            setList(!!list ? list : res.data);
            setLoading(false);
            if(!!count)
                setViewCount(count);

            if (res.data?.length == 0)
                setResponse(empty);
            else
                sessionStorage.setItem("schools", JSON.stringify(res.data));
        })
    }

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

    function handleDropdown(index) {
        setCollapsedItemIndex(index === collapsedItemIndex ? null : index);
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
        console.log(api, item)
        await ApiRequest(`${api}`, "post", item).then(res => {
            console.log(res.status)
            if (res.status == 200 && !res.data)
                setList(list => [...list, { primary: item?.name, secondary: item?.place}]);
            else
                setResponse({ alert: "error", msg: res.data })

            setLoading(false);
            formHandle();
        }, error => {
            setResponse(ErrorHandle(error, navigate));
            formHandle();
        })
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

    return (
        <List className="d-row list-container" component="div">
            {/* Actions/Info */}
            <ListItem className='view-list-result' secondaryAction={!!fields
                && <Button size='large' style={{ minWidth: "120px" }} variant='outlined' color={visibleForm ? "error" : "primary"} disabled={loading} onClick={formHandle}>
                    {visibleForm ? "Avryt" : "Lägg till ny"}
                </Button>}>
                <ListItemText primary={label} secondary={loading ? "Data hämtning pågå ..." : (!!viewCount ? viewCount : `Antal: ${list?.length}`)} />
            </ListItem>

            {/* Response */}
            {!!response && <Response res={response} reset={() => setResponse(null)} />}

            {/* Confirm/Form block */}
            {!!fields && <Collapse in={open} className='d-row' timeout="auto" unmountOnExit>
                {/* Confirm */}
                {!!confirm && <FormButtons confirmable={true} confirmOnly={true} question="Radera" submit={removeItem} cancel={() => setConfirm(null)} />}

                {/* Form */}
                {!!visibleForm && <form className='d-row view-list-form w-100' onSubmit={onSubmit}>
                    {Object.keys(fields)?.map((name, i) => {
                        return <TextField key={i} fullWidth name={name} label={labels[i]} value={item[name]}
                            onChange={onChange} disabled={loading} error={required.indexOf(name) > -1} />
                    })}
                    <Button variant="outlined" type="submit" className="form-button" disabled={loading}>
                        {loading ? <CircularProgress size={20} color="error" /> : "Spara"}
                    </Button>
                </form>}
            </Collapse>}

            {/* Loop of result list */}
            {(list?.length > 0 && !loading) && list?.map((item, index) => {
                const props = !!item?.link ? { onClick: () => navigate(item?.link) } : null;
                return <div key={index} className={`list-item${fullWidth || ((index + 1) === list?.length && ((index + 1) % 2) !== 0) ? " w-100 last" : ""}${collapsedItemIndex === index ? " dropdown" : ""}`}>
                    {/* List item */}
                    <ListItem className="w-100"
                        secondaryAction={
                            <div className="d-row">
                                {item?.includedList?.length > 0 && <IconButton onClick={() => handleDropdown(index)}>
                                    {collapsedItemIndex === index ? <ArrowDropUp /> : <ArrowDropDown />}
                                </IconButton>}
                                {!!fields && <IconButton onClick={() => confirmHandle(item)} color="error" disabled={!!confirm || visibleForm}>
                                   {_.isEqual(confirm, item) ? <CircularProgress size={20} /> : <Delete />} 
                                </IconButton>}
                            </div>
                        } >
                        <ListItemIcon>
                            {index + 1}
                        </ListItemIcon>
                        <ListItemText primary={item?.primary} secondary={item?.secondary} {...props} />
                    </ListItem>

                    {/* If the item has an included list */}
                    <Collapse in={collapsedItemIndex === index} className='d-row dropdown-block' timeout="auto" unmountOnExit>
                        <List style={{ width: "95%", margin: "5px auto" }}>
                            {item?.includedList?.map((inc, ind) => {
                                const collapseProps = !!inc?.link ? { onClick: () => navigate(inc.link) } : null;
                                return <ListItem className="w-100" key={ind} {...collapseProps}>
                                    <ListItemIcon>
                                        <CalendarMonth />
                                    </ListItemIcon>
                                    <ListItemText primary={inc?.primary} secondary={inc?.secondary} />
                                </ListItem>
                            })}
                        </List>
                    </Collapse>
                </div>
            })}

            {/* Loading symbol */}
            {(loading && !open) && <Loading msg="data hämtas ..." />}
        </List>
    )
}

export default ListView