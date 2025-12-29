import { useEffect, useState, use } from "react";

// Installed
import { Button, CircularProgress, Collapse, IconButton, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { ArrowDropDown, ArrowDropUp, CalendarMonth, Delete } from "@mui/icons-material";
import { useLoaderData, useNavigate, useRevalidator, useOutletContext } from 'react-router-dom';

// Components
import TabPanel from './../../components/blocks/TabPanel';
import CollapseForm from "../../components/forms/CollapseForm";
import ConfirmButtons from "../../components/forms/ConfirmButtons";
import Message from "../../components/blocks/Message";

// Storage
import { FetchContext } from "../../storage/FetchContext";


// { loc, includedList, label, fullWidth, api, id, fields, labels, navigate }
function Catalog({ label, fields, api, fullWidth }) {

    const [open, setOpen] = useState(false);
    const [confirmId, setConfirmId] = useState(null);
    const [collapsedItemIndex, setCollapsedItemIndex] = useState(null);
    const { loading } = useOutletContext();

    const list = useLoaderData();
    const viewCount = 0;//count ?? 0;
    const { fetchData, response, pending, handleResponse } = use(FetchContext);

    const navigate = useNavigate();
    const { revalidate } = useRevalidator()

    useEffect(() => {
        setOpen(false);
        setCollapsedItemIndex(null);
    }, [])

    function handleDropdown(index) {
        setCollapsedItemIndex(index === collapsedItemIndex ? null : index);
    }

    async function removeConfirmedItem() {
        const success = await fetchData({ api: `${api}/${confirmId}`, method: "delete", action: "success" });

        if (success)
            revalidate();
        setConfirmId(null);
    }

    return (
        <>
            {/* Tab menu */}
            <TabPanel primary={label} secondary={loading ? "Data hämtning pågå ..." : (!!viewCount ? viewCount : `Antal: ${list?.length}`)} >
                {/* If account is blocked */}
                <div className="d-row">
                    {!!fields && <Button style={{ minWidth: "120px" }} variant='outlined' color={open ? "error" : "primary"} disabled={loading} onClick={() => setOpen((open) => !open)}>
                        {open ? "Avryt" : "Lägg till ny"}
                    </Button>}
                </div>
            </TabPanel>

            {/* Confirm/Form block */}
            {!!fields && <CollapseForm open={open} fieldsName={fields} api={api} />}

            {/* Confirm message and response */}
            <Collapse className="collapse" in={confirmId || response}>
                {/* Confirm */}
                {!!confirmId && <ConfirmButtons
                    question="Radera?"
                    onConfirm={removeConfirmedItem}
                    onCancel={() => setConfirmId(null)} />}

                {/* Response */}
                {!!response && <Message res={response} cancel={() => handleResponse()} />}
            </Collapse>

            <List className="d-row list-container" component="div">
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
                                    {<IconButton onClick={() => setConfirmId(item?.id)} color="error" disabled={confirmId || open || loading || pending}>
                                        {(confirmId == item?.id && pending) ? <CircularProgress size={20} /> : <Delete />}
                                    </IconButton>}
                                </div>
                            }>
                            <ListItemIcon>{index + 1}</ListItemIcon>
                            <ListItemText className="li-div"
                                primary={<span dangerouslySetInnerHTML={{ __html: item?.primary }} />}
                                secondary={<span dangerouslySetInnerHTML={{ __html: item?.secondary }} />} {...props} />
                        </ListItem>

                        {/* If the item has an included list */}
                        {item?.includedList?.length > 0 &&
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
                            </Collapse>}
                    </div>
                })}
            </List>
        </>
    )
}

export default Catalog