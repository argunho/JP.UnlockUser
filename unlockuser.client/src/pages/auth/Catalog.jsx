import { useEffect, useState, use, Fragment } from "react";

// Installed
import { Button, CircularProgress, Collapse, IconButton, List, ListItem, ListItemIcon, ListItemText, Skeleton } from "@mui/material";
import { ArrowDropDown, ArrowDropUp, CalendarMonth, Delete, Download } from "@mui/icons-material";
import { useLoaderData, useNavigate, useRevalidator, useOutletContext, useMatch } from 'react-router-dom';

// Components
import TabPanel from './../../components/blocks/TabPanel';
import CollapseForm from "../../components/forms/CollapseForm";
import ConfirmButtons from "../../components/forms/ConfirmButtons";
import Message from "../../components/blocks/Message";
import SearchFilter from "../../components/forms/SearchFilter";
import ListLoading from "../../components/lists/ListLoading";
import LinearLoading from "../../components/blocks/LinearLoading";

// Hooks
import usePagination from "../../hooks/usePagination";

// Storage
import { FetchContext } from "../../storage/FetchContext";
import { DownloadFile } from "../../functions/Functions";


// { loc, includedList, label, fullWidth, api, id, fields, labels, navigate }
function Catalog({ label, fields, fullWidth, search, download }) {

    const [open, setOpen] = useState(false);
    const [confirmId, setConfirmId] = useState(null);
    const [collapsedItemIndex, setCollapsedItemIndex] = useState(null);
    const [searchWord, setSearchWord] = useState(null);

    const { api, loading } = useOutletContext();
    const catalogLoading = useMatch("/catalog/*");
    const moderatorsLoading = useMatch("/moderators/*");
    const loads = loading && (catalogLoading || moderatorsLoading);

    const loaded = useLoaderData();
    const list = loaded?.list ?? loaded;
    const { fetchData, response, pending, handleResponse } = use(FetchContext);

    const navigate = useNavigate();
    const { revalidate } = useRevalidator()

    const { content: pagination, page, perPage } = usePagination(
        {
            length: list.length,
            loading: loads,
            number: 20
        });

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

    async function onDownload(id){
        const blob = await fetchData({ api: `${download}/${id}`, method: "get", action: "return", responseType: "blob" });
        DownloadFile(blob, `${api}_${id}.txt`);
    }

    const items = searchWord ? list?.filter(x => JSON.stringify(x).toLowerCase().includes(searchWord?.toLowerCase())) : list;

    if (loading && !loads)
        return <LinearLoading size={30} msg="Var vänlig vänta, data hämtas ..." cls="curtain" />

    return (
        <>
            {/* Tab menu */}
            <TabPanel primary={loads ? <Skeleton variant="rectangular" animation="wave" width={200} height={30} /> : label}
                secondary={loads ? "Data hämtning pågår ..." : loaded?.secondaryLabel} >

                {/* If account is blocked */}
                {!loads && <div className="d-row">
                    {!!fields && <Button style={{ minWidth: "120px" }} variant='outlined' color={open ? "error" : "primary"} disabled={loads} onClick={() => setOpen((open) => !open)}>
                        {open ? "Avryt" : "Lägg till ny"}
                    </Button>}

                    {/* Search filter */}
                    {search && <SearchFilter label="anställda" disabled={loads || response}
                        onSearch={(value) => setSearchWord(value)} onReset={() => setSearchWord(null)} />}
                </div>}
            </TabPanel>

            {/* Pagination */}
            {!open && pagination}

            {/* Confirm/Form block */}
            {!!fields && <CollapseForm open={open} fieldsName={fields} api={api} />}

            {/* Confirm message and response */}
            <Collapse className="collapse w-100" in={confirmId || response}>
                {/* Confirm */}
                {!!confirmId && <ConfirmButtons
                    question="Radera?"
                    onConfirm={removeConfirmedItem}
                    onCancel={() => setConfirmId(null)} />}

                {/* Response */}
                {!!response && <Message res={response} cancel={() => handleResponse()} />}
            </Collapse>

            {(!open && (items?.length > 0 && !loads)) && <List className="d-row list-container w-100">
                {/* Loop of result list */}
                {items?.filter((x, index) => (index + 1) > perPage * (page - 1) && (index + 1) <= (perPage * page))?.map((item, ind) => {
                    const onClickProps = !!item?.link ? { onClick: () => navigate(item?.link) } : null;

                    return <Fragment key={ind}>
                        {/* List item */}
                        <ListItem
                            className={`list-item${fullWidth || ((ind + 1) === items?.length && (items?.length % 2) !== 0) ? " w-100 last" : ""}
                                        ${collapsedItemIndex === ind ? " dropdown" : ""}`}
                            secondaryAction={
                                <div className="d-row">

                                    {/* Download button */}
                                    {download && <IconButton onClick={() => onDownload(item?.id)}>
                                        <Download />
                                    </IconButton>}

                                    {/* Dropdown and delete button */}
                                    {item?.includedList?.length > 0 
                                    ? <IconButton onClick={() => handleDropdown(ind)}>
                                        {collapsedItemIndex === ind ? <ArrowDropUp /> : <ArrowDropDown />}
                                    </IconButton> 
                                    : <IconButton onClick={() => setConfirmId(item?.id)} color="error" disabled={confirmId || open || loads || pending}>
                                            {(confirmId == item?.id && pending) ? <CircularProgress size={20} /> : <Delete />}
                                        </IconButton>}
                                </div>
                            }
                        >
                            <ListItemIcon>{ind + 1}</ListItemIcon>
                            <ListItemText className="li-div"
                                primary={<span dangerouslySetInnerHTML={{ __html: item?.primary }} />}
                                secondary={<span dangerouslySetInnerHTML={{ __html: item?.secondary }} />}
                                {...onClickProps}
                            />
                        </ListItem>

                        {/* If the item has an included list */}
                        {item?.includedList?.length > 0 &&
                            <Collapse in={collapsedItemIndex === ind} className='d-row dropdown-block' timeout="auto" unmountOnExit>
                                <List style={{ width: "95%", margin: "5px auto" }}>
                                    {item?.includedList?.map((inc, index) => {
                                        const collapseProps = !!inc?.link ? { onClick: () => navigate(inc.link) } : null;
                                        return <ListItem className="w-100" key={index} {...collapseProps}>
                                            <ListItemIcon>
                                                <CalendarMonth />
                                            </ListItemIcon>
                                            <ListItemText primary={inc?.primary} secondary={inc?.secondary} />
                                        </ListItem>
                                    })}
                                </List>
                            </Collapse>}
                    </Fragment>
                })}
            </List>}

            {/* If list is empty */}
            {(!open && (!list || list?.length == 0 || loads)) && <ListLoading rows={1} pending={loads} />}
        </>
    )
}

export default Catalog