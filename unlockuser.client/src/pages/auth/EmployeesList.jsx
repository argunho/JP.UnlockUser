import { useEffect, useState } from 'react';

// Installed
import {
    Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton,
    InputLabel, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, ListSubheader, MenuItem, Pagination, Select, Typography
} from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank, Close, Delete, OpenInFull, Refresh } from '@mui/icons-material';

// Components
import SearchFilter from '../../components/SearchFilter';
import Response from '../../components/Response';
import Loading from '../../components/Loading';
import FormButtons from '../../components/FormButtons';

// Functions
import { ErrorHandle } from '../../functions/ErrorHandle';

// Services
import ApiRequest from '../../services/ApiRequest';

// Css
import '../../assets/css/listview.css';

function EmployeesList({navigate}) {
    EmployeesList.displayName = "EmployeesList";

    const [initList, setInit] = useState([]);
    const [list, setList] = useState([]);
    const [response, setResponse] = useState();
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState([]);
    const [group, setGroup] = useState();
    const [page, setPage] = useState(1);
    const [userData, setUserData] = useState();
    const [clean, setClean] = useState(true);
    const [items, setItems] = useState([]);
    const [updating, setUpdating] = useState(false);
    const [changed, setChanged] = useState(false);
    const [open, setOpen] = useState(false);
    const perPage = 20;

    const noResult = { alert: "info", msg: "Inga personal hittades." };

    useEffect(() => {
        getGroups();
        setClean(false);
    }, [])

    useEffect(() => {
        setOpen(false);
        if (group?.length > 0)
            getEmployees();
    }, [group])

    async function getGroups() {
        await ApiRequest(`app/groups`).then(res => {
            if (res.data != null) {
                setGroups(res.data);
                setGroup(res.data[0]);
            } else
                setLoading(false);
        }, error => {
            ErrorHandle(error, navigate);
            setLoading(false);
        })
    }

    async function getEmployees() {
        setLoading(true);
        setResponse();
        setList([]);
        await ApiRequest(`app/authorized/${group}`).then(res => {
            const { employees, selections } = res.data;
            setInit(employees);
            setList(employees);
            setItems(selections);
            setLoading(false);
            if (res.data === null || res.data?.length === 0)
                setResponse(noResult);
        }, error => {
            ErrorHandle(error, navigate);
            setLoading(false);
        })
    }

    function listFilterBySearchKeyword(value) {
        if (page > 1)
            setPage(1);
        if (value?.length >= 3)
            setList(list.filter(x => JSON.stringify(x).toLowerCase().includes(value?.toLowerCase())));
        else if (value === "")
            resetActions();
    }

    function handlePageChange(e, value) {
        setPage(value);
    }

    async function renewList() {
        setLoading(true);
        setList([]);
        await ApiRequest("app/renew/jsons").then(res => {
            if (res.status === 200) {
                getEmployees();
                sessionStorage.setItem("updated", "true");
            }

            setLoading(false);
        }, error => {
            setResponse({ alert: "warning", msg: `Något har gått snett: Fel: ${error}` });
            setLoading(false);
        })
    }

    function clickHandle(item, index) {
        let array = userData.includedList;
        if (item?.boolValue !== undefined) {
            if (!item?.default)
                array = array.filter((x, ind) => index != ind);
            else
                array[index].boolValue = !item.boolValue;
        } else
            array = array.filter((x, ind) => index != ind);
        console.log(item?.boolValue, index, array)
        setUserData({ ...userData, includedList: array });
        setChanged(true);
    }

    function updateAccessList(item) {
        setOpen(false)
        let array = [...userData?.includedList];
        if (item?.removable !== undefined) 
            item.removable = true;
        else
            delete item.secondary;

        array.push(item);
        setChanged(true);
        setUserData({ ...userData, includedList: array });
    }

    function closeModal(update = false) {
        setChanged(false);
        setUpdating(false);
        setUserData(null);
        if (update)
            getEmployees();
    }

    function resetActions() {
        setList(initList);
        setResponse();
        setLoading(false);
        setClean(true);
        setUpdating(false);
        setChanged(false);
    }

    async function onSubmit() {
        setUpdating(true);

        const obj = JSON.parse(JSON.stringify(userData));
        delete obj.primary,
            delete obj.secondary,
            delete obj.boolValue,
            obj.offices = obj.includedList.map((o) => {
                return o?.primary;
            })
        obj.managers = obj.includedList.map((m) => {
            return {
                username: m?.id ?? m?.username,
                displayName: m?.primary,
                division: m?.secondary,
                disabled: m?.boolValue ?? false,
                default: m?.default ?? false
            }
        })
        delete obj.includedList;

        await ApiRequest(`app/employee/${group}`, "put", obj).then(res => {
            setResponse(res.data ?? {});
        }, error => {
            setResponse({ alert: "warning", msg: `Något har gått snett: Fel: ${error}` });
            closeModal();
        })
    }

    const label = group === "Studenter" ? "Avdelning/Skola" : "Chef";

    return (
        <div className='interior-div view-list'>

            {/* List filter */}
            <div className="d-row view-list-container search-container">
                {/* Search filter */}
                <SearchFilter label="anställda" disabled={loading || response} clean={clean || loading}
                    onChange={listFilterBySearchKeyword} onReset={resetActions} />

                {/* Groups filter */}
                <Box sx={{ minWidth: 160, marginBottom: "9px" }}>
                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">Grupper</InputLabel>
                        <Select value={group ?? ""} label="Grupper" labelId="demo-simple-select-label"
                            onChange={(e) => setGroup(e.target.value)} sx={{ height: 50, color: "#1976D2" }} disabled={loading}>
                            {groups?.map((name, index) => (
                                <MenuItem value={name} key={index}>
                                    <span style={{ marginLeft: "10px" }}> - {name}</span>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </div>

            {/* Result list */}
            <List className="d-row list-container">
                {/* Actions/Info */}
                <ListItem className='view-list-result' secondaryAction={<Button size='large' variant='outlined'
                    disabled={loading || !!sessionStorage.getItem("updated")}
                    endIcon={<Refresh />} onClick={renewList}>
                    Uppdatera listan
                </Button>}>
                    <ListItemText primary="Behöriga användare" secondary={loading ? "Data hämtning pågår ..." : `Antal: ${list?.length}`} />
                </ListItem>

                {/* Loop of result list */}
                {(list?.length > 0 && !loading) && list?.filter((x, index) => (index + 1) > perPage * (page - 1) && (index + 1) <= (perPage * page))?.map((item, index) => {
                    const calculatedIndex = (perPage * (page - 1)) + (index + 1);
                    return <ListItem key={index} className={`list-item${(calculatedIndex === list?.length && ((index + 1) % 2) !== 0) ? " w-100 last" : ""}`}
                        secondaryAction={<IconButton onClick={() => setUserData(item)}><OpenInFull /></IconButton>}>
                        <ListItemIcon>
                            {page > 1 ? calculatedIndex : index + 1}
                        </ListItemIcon>
                        <ListItemText primary={item?.primary} secondary={item?.secondary} />
                    </ListItem>
                })}

                {/* If listan is empty */}
                {(!loading && list?.filter((x, index) => (index + 1) > perPage * (page - 1) && (index + 1) <= (perPage * page))?.length == 0)
                    && <Response response={{ alert: "info", msg: "Inga anställda hittades med matchande sökord." }} reset={resetActions} />}
            </List>

            {/* Loading symbol */}
            {loading && <Loading msg="data hämtas ..." />}

            {/* Message if result is null */}
            {(response && !loading && !open) && <Response res={response} reset={resetActions} />}

            {/* Pagination */}
            {(list?.length > 0 && !loading) && <div className="pagination w-100">
                <Pagination count={Math.ceil(list?.length / perPage)}
                    page={page} onChange={handlePageChange} variant="outlined" shape="rounded" />
            </div>}

            {/* Modal form */}
            <Dialog open={!!userData} onClose={() => closeModal()} aria-labelledby="draggable-dialog-title" className='modal-wrapper print-page' id="content" >

                <DialogTitle className='view-modal-label'
                    id="draggable-dialog-title" dangerouslySetInnerHTML={{ __html: userData?.primary + "<span>" + userData?.title + "</span>" }}>
                </DialogTitle>

                {/* View this block if data is a text */}
                <DialogContent style={{ position: "relative" }}>

                    <Box className='view-list-result'>
                        <Typography>{label}</Typography>
                    </Box>

                    {/* List of included list */}
                    <div className='w-100 view-modal-list-wrapper' style={{ height: "400px" }}>
                        <List className="d-row view-modal-list w-100">
                            {!!userData && userData.includedList?.map((item, ind) => {
                                const schools = group === "Studenter";
                                return <ListItem key={ind} className='modal-list-item w-100'
                                    secondaryAction={<IconButton onClick={() => clickHandle(item, ind)} disabled={updating}>
                                        {schools ? <Delete color="error" /> : (item?.boolValue ? <CheckBoxOutlineBlank /> : <CheckBox color="primary" />)}
                                    </IconButton>}>
                                    <ListItemAvatar>
                                        {ind + 1}
                                    </ListItemAvatar>
                                    <ListItemText primary={item.primary} secondary={item?.secondary} />
                                </ListItem>
                            })}
                        </List>
                    </div>

                    {/* List with choices */}
                    {open && <List className='choices-list w-100 h-100'>
                        <ListItem>
                            <ListItemText primary="Välj från listan" />
                        </ListItem>

                        {items?.map((item, index) => {
                            return <div key={index}>
                                {items[index - 1]?.secondary !== item?.secondary && <ListSubheader className='choices-subheader' color='primary'>{item?.secondary}</ListSubheader>}
                                <ListItemText primary={`- ${item?.primary}`} className='choices-item'
                                    onClick={() => updateAccessList(item)} disabled={!!userData?.includedList.find(x => x.primary == item.primary && x.secondary == item.secondary)} />
                            </div>
                        })}
                    </List>}

                </DialogContent>

                <DialogActions className="list-view-modal-buttons d-column">
                    {/* Actions buttons */}
                    {!response && <FormButtons label="Spara" disabled={!changed} loading={updating} swap={true} c
                        confirmable={true} submit={onSubmit} cancel={closeModal} >
                        <Button variant={open ? "outlined" : "contained"} color={!open ? "primary" : "error"}
                            onClick={() => setOpen(!open)} style={{ width: "140px" }} disabled={updating}>
                            {open ? <Close /> : `Lägg till ${label}`}
                        </Button>
                    </FormButtons>}

                    {/* Response */}
                    {!!response && <Response res={response} reset={resetActions}/>}
                </DialogActions>
            </Dialog>
        </div >
    )
}

export default EmployeesList;