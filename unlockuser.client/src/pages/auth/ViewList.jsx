import { useEffect, useState } from 'react';

// Installed
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, 
        InputLabel, List, ListItem, ListItemIcon, ListItemText, MenuItem, Pagination, Paper, Select, TextField } from '@mui/material';
import { Close, Delete, OpenInFull, Refresh } from '@mui/icons-material';
import Draggable from 'react-draggable';

// Components
import SearchFilter from '../../components/SearchFilter';
import Response from '../../components/Response';
import Loading from '../../components/Loading';

// Services
import ApiRequest from '../../services/ApiRequest';

// Css
import '../../assets/css/listview.css';

function PaperComponent(props) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
            cancel={'[class*="MuiDialogContent-root"]'}>
            <Paper {...props} />
        </Draggable>
    );
}

function ViewList() {
    ViewList.displayName = "ViewList";

    const [initList, setInit] = useState([]);
    const [list, setList] = useState([]);
    const [response, setResponse] = useState();
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState([]);
    const [group, setGroup] = useState("");
    const [page, setPage] = useState(1);
    const [userData, setUserData] = useState();
    const [confirm, setConfirm] = useState(false);
    const [permission, setPermission] = useState("");
    const [updating, setUpdating] = useState(false);
    const [changed, setChanged] = useState(false);

    const perPage = 20;

    const noResult = { alert: "info", msg: "Inga personal hittades." };

    useEffect(() => {
        getData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setList([]);
        setPage(1);
        setTimeout(() => {
            getListPerGroup();
        }, 100)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group])

    async function getData() {
        setLoading(true);
        setResponse();
        setList([]);
        await ApiRequest("app/authorized/employees").then(response => {
            const res = response.data;
            setInit(res)
            setLoading(false);
            if (res === null || res?.length === 0)
                setResponse(noResult);
            else {
                const groupNames = res.map(item => {
                    return item?.group?.name;
                });
                setGroups(groupNames)
                setGroup(groupNames[0]);
            }
        }, error => {
            setResponse({ alert: "warning", msg: `Något har gått snett: Fel: ${error}` });
            setLoading(false);
        })
    }

    function getListPerGroup() {
        const groupList = initList?.find(x => x.group?.name === group)?.employees;
        if (!groupList) return;

        setList(groupList);
        setLoading(false);
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
        await ApiRequest("app/renew/authorized/employees/list").then(res => {
            if (res.status === 200)
                getData();
            else
                setLoading(false);
        }, error => {
            setResponse({ alert: "warning", msg: `Något har gått snett: Fel: ${error}` });
            setLoading(false);
        })
    }

    function updatePermissions() {
        let permissions = [...userData?.permissions];
        if (permissions.indexOf(permission) > -1)
            return;
        permissions.push(permission);
        setPermission("");
        setChanged(true);
        setUserData({ ...userData, permissions: permissions });
    }

    function removePermission(name) {
        setUserData({ ...userData, permissions: userData.permissions.filter(x => x !== name) });
        setChanged(true);
    }

    async function onSubmit() {
        setConfirm(false);
        setUpdating(true);
        await ApiRequest(`app/update/employee/data/${userData?.name}`, "put", userData).then(res => {
            if (res.data !== null)
                setResponse(res.data);
            setTimeout(() => {
                closeModal(!res?.data);
            }, 1000)
        }, error => {
            setResponse({ alert: "warning", msg: `Något har gått snett: Fel: ${error}` });
            closeModal();
        })
    }

    function closeModal(update = false) {
        setConfirm(false);
        setChanged(false);
        setUpdating(false);
        setUserData(null);
        if (update)
            getData();
    }

    function resetActions() {
        setList(initList?.find(x => x.group?.name === group)?.employees);
        setResponse();
        setLoading(false);
    }

    return (
        <div className='interior-div view-list'>

            {/* List filter */}
            <div className="d-row view-list-container search-container">
                {/* Search filter */}
                <SearchFilter label="anställda" disabled={loading || response} clean={list?.length === 0} onChange={listFilterBySearchKeyword} onReset={resetActions} />

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
                    disabled={loading} endIcon={<Refresh />} onClick={renewList}>
                    Uppdatera listan
                </Button>}>
                    <ListItemText primary="Behöriga användare" secondary={loading ? "Data hämtning pågå ..." : `Antal: ${list?.length}`} />
                </ListItem>

                {/* Loop of result list */}
                {(list?.length > 0 && !loading) && list?.filter((x, index) => (index + 1) > perPage * (page - 1) && (index + 1) <= (perPage * page))?.map((item, index) => {
                    const calculatedIndex = (perPage * (page - 1)) + (index + 1);
                    return <ListItem key={index} className={`list-item${(calculatedIndex === list?.length && ((index + 1) % 2) !== 0) ? " w-100 last" : ""}`}
                        secondaryAction={<IconButton onClick={() => setUserData(item)}><OpenInFull /></IconButton>}>
                        <ListItemIcon>
                            {page > 1 ? calculatedIndex : index + 1}
                        </ListItemIcon>
                        <ListItemText primary={item?.displayName} secondary={item?.office} />
                    </ListItem>
                })}
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
            <Dialog open={!!userData} onClose={closeModal} PaperComponent={PaperComponent}
                aria-labelledby="draggable-dialog-title" className='modal-wrapper print-page' id="content" >

                <DialogTitle className='view-modal-label'
                    id="draggable-dialog-title" dangerouslySetInnerHTML={{ __html: userData?.displayName + "<span>" + userData?.title + "</span>" }}>
                </DialogTitle>

                {/* View this block if datat is a text */}
                <DialogContent className=''>
                    <List className="d-row view-modal-list">
                        <ListItem className='view-list-result'>
                            <ListItemText primary="Behörogheter" />
                        </ListItem>
                        {userData?.permissions?.map((name, ind) => {
                            return <ListItem key={ind} className='modal-list-item' secondaryAction={<IconButton onClick={() => removePermission(name)}>
                                <Delete color="error" />
                            </IconButton>}>
                                <ListItemText primary={name} />
                            </ListItem>
                        })}
                    </List>

                    {/* Textfield */}
                    <div className='d-row view-modal-form w-100'>
                        <TextField id="permission" className="w-100" label="Ny behörighet" value={permission}
                            onChange={(e) => setPermission(e.target.value)} />
                        <Button variant="outlined" onClick={updatePermissions} disabled={!permission}>
                            Lägg till
                        </Button>
                    </div>
                </DialogContent>

                <DialogActions className="no-print modal-buttons-wrapper">
                    {!confirm && <>
                        <Button variant="text"
                            className='button-btn'
                            color="primary"
                            disabled={!changed}
                            onClick={() => setConfirm(true)}>
                            {updating ? <CircularProgress size={20} /> : "Spara"}
                        </Button>
                        {!updating && <Button variant='contained' color="error" autoFocus onClick={closeModal}>
                            <Close />
                        </Button>}
                    </>}

                    {/* Confirm actions block */}
                    {confirm && <>
                        <p className='confirm-title'>Skicka?</p>
                        <Button className='button-btn button-action' onClick={onSubmit} variant='contained' color="error">Ja</Button>
                        <Button className='button-btn button-action' variant='contained' color="primary" autoFocus onClick={closeModal}>Nej</Button>
                    </>}
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default ViewList;