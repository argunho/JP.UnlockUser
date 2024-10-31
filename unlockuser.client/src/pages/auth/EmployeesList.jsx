import { useEffect, useState } from 'react';

// Installed
import {
    Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton,
    InputLabel, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, ListSubheader, MenuItem, Pagination, Select
} from '@mui/material';
import { Close, Delete, OpenInFull, Refresh } from '@mui/icons-material';

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
    const [group, setGroup] = useState("");
    const [page, setPage] = useState(1);
    const [userData, setUserData] = useState();
    const [confirm, setConfirm] = useState(false);
    const [clean, setClean] = useState(true);
    const [office, setOffice] = useState("");
    const [items, setItems] = useState([]);
    const [updating, setUpdating] = useState(false);
    const [changed, setChanged] = useState(false);
    const perPage = 20;

    const noResult = { alert: "info", msg: "Inga personal hittades." };

    useEffect(() => {
        getGroups();
        setClean(false);
    }, [])

    useEffect(() => {
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
            const { employees, selections} = res.data;
            setInit(employees);
            setList(employees);
            setItems(selections);
            setLoading(false);
            console.log(employees)
            if (res === null || res?.length === 0)
                setResponse(noResult);
        }, error => {
            ErrorHandle(error);
            setLoading(false);
        })
    }

    function listFilterBySearchKeyword(value) {
        if (page > 1)
            setPage(1);
        if (value?.length >= 3) {
            value = value.toLowerCase();
            const employees = initList.find(x => x.group?.name === group)?.employees;
            let filteredList = employees?.filter(x => x?.name?.toLowerCase().includes(value) || x?.division?.toLowerCase().includes(value)
                || x?.office?.toLowerCase().includes(value) || x?.email?.toLowerCase().includes(value)
                || x?.displayName?.toLowerCase().includes(value));
            setTimeout(() => {
                setList(filteredList);
            }, 100)
        } else if (value === "")
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

    function updateOffices() {
        let offices = [...userData?.offices];
        if (offices.indexOf(office) > -1)
            return;
        offices.push(office);
        setOffice("");
        setChanged(true);
        setUserData({ ...userData, offices: offices });
    }

    function removeOffice(name) {
        setUserData({ ...userData, offices: userData.offices.filter(x => x !== name) });
        setChanged(true);
    }

    function closeModal(update = false) {
        setConfirm(false);
        setChanged(false);
        setUpdating(false);
        setUserData(null);
        setOffice(null);
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
                        <Select value={group} label="Grupper" labelId="demo-simple-select-label"
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
                <Pagination count={Math.ceil(initList.find(x => x.group?.name === group)?.employees?.length / perPage)}
                    page={page} onChange={handlePageChange} variant="outlined" shape="rounded" />
            </div>}

            {/* Modal form */}
            <Dialog open={!!userData} onClose={() => closeModal()} aria-labelledby="draggable-dialog-title" className='modal-wrapper print-page' id="content" >

                <DialogTitle className='view-modal-label'
                    id="draggable-dialog-title" dangerouslySetInnerHTML={{ __html: userData?.primary + "<span>" + userData?.title + "</span>" }}>
                </DialogTitle>

                {/* View this block if data is a text */}
                <DialogContent>
                    <List className="d-row ai-center view-modal-list w-100">
                        <ListItem className='view-list-result'>
                            <ListItemText primary={label} />
                        </ListItem>

                        {!!userData && userData.includedList?.map((item, ind) => {
                            console.log(item)
                            return <ListItem key={ind} className='modal-list-item w-100' disa
                                secondaryAction={group === "Studenter" && <IconButton onClick={() => removeOffice(item)}>
                                    <Delete color="error" />
                                </IconButton>}>
                                <ListItemAvatar>
                                    {ind + 1}
                                </ListItemAvatar>
                                <ListItemText primary={item.primary} secondary={item?.secondary} />
                            </ListItem>
                        })}
                    </List>

                    {/* Textfield */}
                    {items?.length > 1 && <div className='d-row view-modal-form w-100'>
                        <FormControl fullWidth>
                            <InputLabel id="demo-simple-select-label">{label}</InputLabel>
                            <Select
                                value={office}
                                label={label}
                                labelId="demo-simple-select-label"
                                onChange={(e) => setOffice(e.target.value)}
                                sx={{ height: 50, color: "#1976D2" }}
                            >
                                <MenuItem defaultChecked={true} checked>Välj från listan</MenuItem>
                                <MenuItem disabled></MenuItem>
                                {items?.map((item, index) => {
                                    return <>
                                        {items[index - 1]?.secondary !== item?.secondary && <ListSubheader>{item?.secondary}</ListSubheader>}
                                        <MenuItem key={index} value={item?.primary} disabled={userData?.offices?.indexOf(item?.primary) > -1}>
                                            <span style={{ marginLeft: "10px" }}>{` - ${item?.primary}`}</span>
                                        </MenuItem>
                                    </>
                                })}
                            </Select>
                        </FormControl>

                        <Button variant="outlined" className="form-button" onClick={updateOffices} disabled={!office}>
                            Lägg till
                        </Button>
                    </div>}
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