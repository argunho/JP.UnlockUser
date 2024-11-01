import { useEffect, useState } from 'react';

// Installed
import {
    Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton,
    InputLabel, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, ListSubheader, MenuItem, Pagination, Select,
    TextField,
    Typography
} from '@mui/material';
import { ArrowDropDown, CheckBox, CheckBoxOutlineBlank, Close, Delete, OpenInFull, Refresh } from '@mui/icons-material';

// Components
import SearchFilter from '../../components/SearchFilter';
import Response from '../../components/Response';
import Loading from '../../components/Loading';

// Functions
import { ErrorHandle } from '../../functions/ErrorHandle';

// Services
import ApiRequest from '../../services/ApiRequest';

// Css
import '../../assets/css/listview.css';

function EmployeesList() {
    EmployeesList.displayName = "EmployeesList";

    const [initList, setInit] = useState([]);
    const [list, setList] = useState([]);
    const [response, setResponse] = useState();
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState([]);
    const [group, setGroup] = useState();
    const [page, setPage] = useState(1);
    const [userData, setUserData] = useState();
    const [confirm, setConfirm] = useState(false);
    const [clean, setClean] = useState(true);
    const [selected, setSelected] = useState("");
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
            ErrorHandle(error);
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
            ErrorHandle(error);
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
            if (item?.removable)
                array = array.filter((x, ind) => index != ind);
            else
                array[index].boolValue = !item.boolValue;
        } else
            array = array.filter((x, ind) => index != ind);
        console.log(item?.boolValue, index, array)
        setUserData({ ...userData, includedList: array });
        setChanged(true);
    }

    function handleSelected(item) {
        setSelected(item);
        setOpen(false);
    }

    function updateAccessList() {
        setSelected(null);
        let array = [...userData?.includedList];
        selected.removable = true;
        array.push(selected);
        setSelected("");
        setChanged(true);
        setUserData({ ...userData, includedList: array });
    }

    function closeModal(update = false) {
        setConfirm(false);
        setChanged(false);
        setUpdating(false);
        setUserData(null);
        setSelected(null);
        if (update)
            getEmployees();
    }

    function resetActions() {
        setList(initList);
        setResponse();
        setLoading(false);
        setClean(true);
    }

    async function onSubmit() {
        setConfirm(false);
        setUpdating(true);
        await ApiRequest(`app/update/employee/data/${userData?.name}`, "put", userData).then(res => {
            if (res.data !== null)
                setResponse(res.data);

            setTimeout(() => {
                closeModal(true);
            }, 1000)
        }, error => {
            setResponse({ alert: "warning", msg: `Något har gått snett: Fel: ${error}` });
            closeModal();
        })
    }

    const label = group === "Studenter" ? "Avdelning/Skola" : "Chefer";

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
                    // disabled={loading || !!sessionStorage.getItem("updated")}
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
            {(response && !loading) && <Response response={response} reset={resetActions} />}

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
                    <div className='w-100 view-modal-list-wrapper' style={{height: "400px"}}>
                        <List className="d-row view-modal-list w-100">
                            {!!userData && userData.includedList?.map((item, ind) => {
                                const schools = group === "Studenter";
                                return <ListItem key={ind} className='modal-list-item w-100'
                                    secondaryAction={<IconButton onClick={() => clickHandle(item, ind)}>
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

                    {/* Textfield */}
                    {items?.length > 1 && <div className='d-row view-modal-form w-100'>
                        <FormControl fullWidth>
                            <TextField label={label} value={selected?.primary ?? ""} InputProps={{
                                endAdornment: <IconButton onClick={() => setOpen(true)}>
                                    <ArrowDropDown />
                                </IconButton>
                            }} />
                        </FormControl>

                        <Button variant="outlined" className="form-button" onClick={updateAccessList} disabled={!selected}>
                            Lägg till
                        </Button>
                    </div>}

                    {/* List with choices */}
                    {open && <List className='choices-list w-100 h-100'>
                        <ListItem secondaryAction={<IconButton onClick={() => setOpen(false)}><Close /></IconButton>}>
                            <ListItemText primary="Välj från listan" />
                        </ListItem>

                        {items?.map((item, index) => {
                            return <div key={index}>
                                {items[index - 1]?.secondary !== item?.secondary && <ListSubheader className='choices-subheader' color='primary'>{item?.secondary}</ListSubheader>}
                                <ListItemText primary={`- ${item?.primary}`} className='choices-item'
                                    onClick={() => handleSelected(item)} disabled={!!userData?.includedList.find(x => x.primary == item.primary && x.secondary == item.secondary)} />
                            </div>
                        })}
                    </List>}

                </DialogContent>

                <DialogActions className="no-print modal-buttons-wrapper">
                    {(!confirm && group === "Studenter") &&
                        <Button variant="text"
                            className='button-btn'
                            color="primary"
                            disabled={!changed}
                            onClick={() => setConfirm(true)}>
                            {updating ? <CircularProgress size={20} /> : "Spara"}
                        </Button>}

                    {(!updating && !confirm) && <Button variant='contained' color="error" autoFocus onClick={() => closeModal()}>
                        <Close />
                    </Button>}

                    {/* Confirm actions block */}
                    {confirm && <>
                        <p className='confirm-title'>Skicka?</p>
                        <Button className='button-btn button-action' onClick={onSubmit} variant='contained' color="error">Ja</Button>
                        <Button className='button-btn button-action' variant='contained' color="primary" autoFocus onClick={() => closeModal()}>Nej</Button>
                    </>}
                </DialogActions>
            </Dialog>
        </div >
    )
}

export default EmployeesList;