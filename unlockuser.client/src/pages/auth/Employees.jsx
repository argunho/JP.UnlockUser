import { useEffect, useState, use } from 'react';

// Installed
import {
    Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
    List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, Typography
} from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank, Close, Delete, OpenInFull } from '@mui/icons-material';
import { useOutletContext } from 'react-router-dom';


// Components
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

    const [userData, setUserData] = useState();
    const [updating, setUpdating] = useState(false);
    const [changed, setChanged] = useState(false);
    const [open, setOpen] = useState(false);

    const { loading: buffering, group, moderators } = useOutletContext();
    const { response, pending, fetchData, handleResponse } = use(FetchContext);
    const loading = buffering || pending;
  
    // const { selections } = useLoaderData() ?? {};
    // const items = selections ?? [];


    const { content: pagination, page, perPage } = usePagination(
        {
            length: moderators.length,
            loading,
            number: 20
        });


    useEffect(() => {
        document.title = "UnlockUser | Anställda";
    }, [])

    useEffect(() => {
        setOpen(false);
    }, [group])


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

    // function updateAccessList(item) {
    //     setOpen(false)
    //     let array = [...userData?.includedList];
    //     if (item?.removable !== undefined)
    //         item.removable = true;
    //     else if (group === "Studenter")
    //         delete item.secondary;

    //     array.push(item);
    //     setChanged(true);
    //     setUserData({ ...userData, includedList: array });
    // }

    function closeModal() {
        setChanged(false);
        setUpdating(false);
        setUserData(null);
    }

    function resetActions() {
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

        await fetchData({ api: `employees/group/${group}`, method: "put", data: obj })
        closeModal();
    }

    const label = group === "Studenter" ? "Skola" : "Chef";

    return (
        <>

            {/* Pagination */}
            {(moderators?.length > perPage && !loading) && pagination}
            {/* Result list */}
            <List className="d-row list-container">


                {/* Loop of result list */}
                {(moderators?.length > 0 && !loading) && moderators?.filter((x, index) => (index + 1) > perPage * (page - 1) && (index + 1) <= (perPage * page))?.map((item, index) => {
                    const calculatedIndex = (perPage * (page - 1)) + (index + 1);
                    return <ListItem key={index} className={`list-item${(calculatedIndex === moderators?.length && ((index + 1) % 2) !== 0) ? " w-100 last" : ""}`}
                        secondaryAction={<IconButton onClick={() => openModal(item)}><OpenInFull /></IconButton>}>
                        <ListItemIcon>
                            {page > 1 ? calculatedIndex : index + 1}
                        </ListItemIcon>
                        <ListItemText primary={item?.primary} secondary={item?.secondary} />
                    </ListItem>
                })}

                {/* If listan is empty */}
                {(!loading && moderators?.filter((x, index) => (index + 1) > perPage * (page - 1) && (index + 1) <= (perPage * page))?.length == 0)
                    && <Message res={{ color: "info", msg: "Inga anställda hittades med matchande sökord." }} cancel={handleResponse} />}
            </List>

            {/* Loading symbol */}
            {loading && <Loading msg="data hämtas ..." styles={{ minHeight: "calc(100vh - 400px)" }} />}

            {/* Message if result is null */}
            {(response && !loading && !open) && <Message res={response} cancel={handleResponse} />}


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
                    {/* {open && <List className='choices-list w-100 h-100'>
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
                    </List>} */}

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
        </>
    )
}

export default Employees;