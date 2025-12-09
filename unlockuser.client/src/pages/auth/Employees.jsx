import { useEffect, useState, use } from 'react';

// Installed
import {
    Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton,
    InputLabel, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, ListSubheader, MenuItem, Select, Tooltip, Typography
} from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank, Close, Delete, OpenInFull, Refresh } from '@mui/icons-material';
import { useNavigate, useLoaderData, useOutletContext } from 'react-router-dom';


// Components
import SearchFilter from '../../components/forms/SearchFilter';
import Message from '../../components/blocks/Message';
import Loading from '../../components/Loading';
import FormButtons from '../../components/forms/FormButtons';

// Hooks
import usePagination from '../../hooks/usePagination';

// Storage
import { FetchContext } from '../../storage/FetchContext';

// Css
import '../../assets/css/list-view.css';


function Employees() {

    const [group, setGroup] = useState();
    const [userData, setUserData] = useState();
    const [clean, setClean] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [changed, setChanged] = useState(false);
    const [open, setOpen] = useState(false);
    const [searchWord, setSearchWord] = useState("");

    const { loading: buffering, groups, id: groupName } = useOutletContext();
    const { response, pending, fetchData, handleResponse } = use(FetchContext);
    const loading = buffering || pending;

    const navigate = useNavigate()
    const { employees, selections, updated } = useLoaderData() ?? {};
    const items = selections ?? [];

    const list = searchWord ? employees?.filter(x => JSON.stringify(x).toLowerCase().includes(searchWord)) : employees ?? [];
    const { content: pagination, page, perPage } = usePagination(
        {
            length: list.length,
            loading,
            number: 20
        });


    useEffect(() => {
        document.title = "UnlockUser | Anställda";

        if (!groupName)
            navigate(`/employees/${groups[0]?.toLowerCase()}`, { replace: true });
        else
            setGroup(groupName.charAt(0).toUpperCase() + groupName.slice(1));
    }, [])

    useEffect(() => {
        setClean(true);
        setOpen(false);
    }, [group])


    async function renewList() {
        await fetchData({ api: "app/renew/jsons" });
        sessionStorage.setItem("updated", "true");
    }

    function openModal(item) {
        setUserData(item);
        resetActions();
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

        setUserData({ ...userData, includedList: array });
        setChanged(true);
    }

    function updateAccessList(item) {
        setOpen(false)
        let array = [...userData?.includedList];
        if (item?.removable !== undefined)
            item.removable = true;
        else if (group === "Studenter")
            delete item.secondary;

        array.push(item);
        setChanged(true);
        setUserData({ ...userData, includedList: array });
    }

    function closeModal() {
        setChanged(false);
        setUpdating(false);
        setUserData(null);
        // if (update)
        //     getEmployees();
    }

    function resetActions() {
        setClean(true);
        setUpdating(false);
        setChanged(false);
    }

    function switchGroup(e) {
        setGroup(e.target.value);
        navigate(`/employees/${e.target.value?.toLowerCase()}`, { replace: true });
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

        await fetchData({ api: `app/employee/${group}`, method: "put", data: obj })
        closeModal();
    }

    const label = group === "Studenter" ? "Skola" : "Chef";

    return (
        <div className='interior-div view-list'>

            {/* List filter */}
            <div className="d-row view-list-container search-form">
                {/* Search filter */}
                <SearchFilter label="anställda" disabled={loading || response} clean={clean || loading}
                    onChange={(value) => setSearchWord(value.toLowercase())} onReset={resetActions} />

                {/* Groups filter */}
                <Box sx={{ minWidth: 160 }}>
                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">Grupper</InputLabel>
                        <Select value={group ?? ""} label="Grupper" labelId="demo-simple-select-label"
                            onChange={switchGroup} sx={{ color: "#1976D2" }} disabled={loading}>
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
                <ListItem className='view-list-result' secondaryAction={<Tooltip title={`Senast uppdaterade datum: ${updated}`} classes={{
                    tooltip: `tooltip tooltip-margin tooltip-blue`,
                    arrow: `arrow-blue`
                }} arrow>
                    <span>
                        <Button
                            size='large'
                            variant='outlined'
                            disabled={loading || !!sessionStorage.getItem("updated")}
                            endIcon={<Refresh />}
                            onClick={renewList}>
                            Uppdatera listan
                        </Button>
                    </span>
                </Tooltip>}>
                    <ListItemText primary="Behöriga användare" secondary={loading ? "Data hämtning pågår ..." : `Antal: ${list?.length}`} />
                </ListItem>

                {/* Loop of result list */}
                {(list?.length > 0 && !loading) && list?.filter((x, index) => (index + 1) > perPage * (page - 1) && (index + 1) <= (perPage * page))?.map((item, index) => {
                    const calculatedIndex = (perPage * (page - 1)) + (index + 1);
                    return <ListItem key={index} className={`list-item${(calculatedIndex === list?.length && ((index + 1) % 2) !== 0) ? " w-100 last" : ""}`}
                        secondaryAction={<IconButton onClick={() => openModal(item)}><OpenInFull /></IconButton>}>
                        <ListItemIcon>
                            {page > 1 ? calculatedIndex : index + 1}
                        </ListItemIcon>
                        <ListItemText primary={item?.primary} secondary={item?.secondary} />
                    </ListItem>
                })}

                {/* If listan is empty */}
                {(!loading && list?.filter((x, index) => (index + 1) > perPage * (page - 1) && (index + 1) <= (perPage * page))?.length == 0)
                    && <Message res={{ color: "info", msg: "Inga anställda hittades med matchande sökord." }} cancel={handleResponse} />}
            </List>

            {/* Loading symbol */}
            {loading && <Loading msg="data hämtas ..." styles={{ minHeight: "calc(100vh - 400px)" }} />}

            {/* Message if result is null */}
            {(response && !loading && !open) && <Message res={response} cancel={handleResponse} />}

            {/* Pagination */}
            {(list?.length > perPage && !loading) && pagination}

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
                                const disabled = updating || (schools && ["IT avdelning", "IT-avdelning", "IT-enhet"].indexOf(item?.primary) > -1);

                                return <ListItem key={ind} className='modal-list-item w-100'
                                    secondaryAction={<IconButton onClick={() => clickHandle(item, ind)}
                                        color={(disabled || item?.boolValue) ? "inherit" : (schools ? "error" : "primary")} disabled={disabled}>
                                        {schools ? <Delete /> : (item?.boolValue ? <CheckBoxOutlineBlank /> : <CheckBox />)}
                                    </IconButton>}>
                                    <ListItemAvatar> {ind + 1} </ListItemAvatar>
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
                    {!response && <FormButtons
                        label="Spara"
                        disabled={!changed}
                        loading={updating}
                        swap={true}
                        confirmable={true}
                        submit={onSubmit}
                        onCancel={closeModal} >
                        <Button variant={open ? "outlined" : "contained"} color={!open ? "primary" : "error"}
                            onClick={() => setOpen((open) => !open)} style={{ width: "140px" }} disabled={updating}>
                            {open ? <Close /> : `Lägg till ${label}`}
                        </Button>
                    </FormButtons>}

                    {/* Response */}
                    {!!response && <Message res={response} cancel={handleResponse} />}
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default Employees;