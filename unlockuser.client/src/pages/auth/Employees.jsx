import { useEffect } from 'react';

// Installed
import { IconButton, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useOutletContext, useNavigate } from 'react-router-dom';

// Components
import Message from '../../components/blocks/Message';

// Hooks
import usePagination from '../../hooks/usePagination';

// Css
import '../../assets/css/list-view.css';


function Employees() {

    const { loading, moderators, onReset } = useOutletContext();
    const navigate = useNavigate();

    const { content: pagination, page, perPage } = usePagination(
        {
            length: moderators.length,
            loading,
            number: 20
        });

    useEffect(() => {
        document.title = "UnlockUser | Anställda";
    }, [])

    return (
        <>
            {/* Pagination */}
            {pagination}

            {/* If list is empty or bad response from server */}
            {(moderators.length == 0 && !loading)
                && <Message res={{ color: "info", msg: "Inga anställda hittades..." }} 
                    cancel={onReset} styles={{ marginTop: "32px" }} />}

            {/* Result list */}
            {(moderators?.length > 0 && !loading) && <List className="d-row list-container w-100">

                {/* Loop of result list */}
                {moderators?.filter((x, index) => (index + 1) > perPage * (page - 1) && (index + 1) <= (perPage * page))?.map((item, index) => {
                    const calculatedIndex = (perPage * (page - 1)) + (index + 1);
                    return <ListItem key={index} className={`list-item${(calculatedIndex === moderators?.length && ((index + 1) % 2) !== 0) ? " w-100 last" : ""}`}
                        secondaryAction={<IconButton onClick={() => navigate(`/moderators/view/${item?.name}`)}>ArrowForward /></IconButton>}> 
                        <ListItemIcon>
                            {page > 1 ? calculatedIndex : index + 1}
                        </ListItemIcon>
                        <ListItemText primary={<span dangerouslySetInnerHTML={{ __html: item?.primary }} />}
                            secondary={<span dangerouslySetInnerHTML={{ __html: item?.secondary }} />} />
                    </ListItem>
                })}
            </List>}
        </>
    )
}

export default Employees;

            {/* Modal form */}
            // <Dialog open={!!userData} onClose={() => closeModal()} aria-labelledby="draggable-dialog-title" className='modal-wrapper print-page' id="content" >

            //     <DialogTitle className='view-modal-label'
            //         id="draggable-dialog-title" 
            //         dangerouslySetInnerHTML={{ __html: userData?.primary + "<span>" + userData?.title + "</span>" }}>
            //     </DialogTitle>

            //     {/* View this block if data is a text */}
            //     <DialogContent style={{ position: "relative" }}>

            //         <Box className='view-list-result'>
            //             <Typography>{label}</Typography>
            //         </Box>

                    {/* List of included list */}
                    {/* <div className='w-100 view-modal-list-wrapper' style={{ height: "400px" }}>
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
                    </div> */}

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
                    </List>}

                </DialogContent>

                <DialogActions className="list-view-modal-buttons d-column"> */}
                    {/* Actions buttons */}
                    {/* {!response && <FormButtons
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
                    </FormButtons>} */}

                    {/* Response */}
                    {/* {!!response && <Message res={response} cancel={handleResponse} />}
                </DialogActions>
            </Dialog> */}