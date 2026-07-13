import { useState, use, Fragment, useRef, useEffect } from "react";

// Installed
import { Button, CircularProgress, Collapse, IconButton, List, ListItem, ListItemIcon, ListItemText, Skeleton, Tooltip } from "@mui/material";
import { ArrowDropDown, ArrowDropUp, CalendarMonth, Delete, Download, Pageview } from "@mui/icons-material";
import { useLoaderData, useNavigate, useRevalidator, useOutletContext } from 'react-router-dom'; //, useMatch

// Components
import TabPanel from './../../components/blocks/TabPanel';
import CollapseForm from "../../components/forms/CollapseForm";
import ConfirmButtons from "../../components/forms/ConfirmButtons";
import Message from "../../components/blocks/Message";
import SearchFilter from "../../components/forms/SearchFilter";
import ListLoading from "../../components/lists/ListLoading";
// import LinearLoading from "../../components/blocks/LinearLoading";
import ModalOverview from "../../components/modals/ModalOverview";

// Hooks
import usePagination from "../../hooks/usePagination";

// Functions
import { DownloadFile } from "../../functions/Functions";

// Storage
import { FetchContext } from "../../storage/FetchContext";


// { loc, includedList, label, fullWidth, api, id, fields, labels, navigate }
function Catalog({ label, api, fields, fullWidth, search, modal, download, dropdown, disabled }) {

    const { loading, name } = useOutletContext();
    // const catalogLoading = useMatch("/catalog/*");


    const loaded = useLoaderData();
    const list = loaded[name] ?? loaded?.list ?? loaded;
    const { fetchData, response, pending, handleResponse } = use(FetchContext);

    const inputDate = useRef();
    const today = new Date();
    today.setDate(today.getDate());
    const maxDate = today.toISOString().split("T")[0];

    const minDateObj = new Date();
    minDateObj.setDate(today.getDate() - 30);

    const [open, setOpen] = useState(false);
    const [confirmId, setConfirmId] = useState(null);
    const [collapsedIndex, setCollapsedIndex] = useState(null);
    const [searchWord, setSearchWord] = useState(null);
    const [model, setModel] = useState();

    // const yesterday = new Date(today);
    // yesterday.setDate(today.getDate() - 1);

    // const maxDate = yesterday.toISOString().split("T")[0];

    // const minDateObj = new Date();
    // minDateObj.setDate(yesterday.getDate() - 29);
    const minDate = minDateObj.toISOString().split("T")[0];

    const navigate = useNavigate();
    const { revalidate } = useRevalidator()

    const { content: pagination, page, perPage } = usePagination(
        {
            length: list?.length,
            loading: loading,
            number: 20
        });

    useEffect(() => {

        function resetConfirmId() {
            setConfirmId(null);
        }

        if (confirmId)
            resetConfirmId();
    }, [loading]);


    function handleDropdown(index) {
        setCollapsedIndex(index === collapsedIndex ? null : index);
    }

    async function removeConfirmedItem() {
        const success = await fetchData({ api: `${api}/${confirmId}`, method: "delete", action: "success" });

        if (success)
            revalidate();
        setConfirmId(null);
    }

    async function onDownload(id) {
        if (model) setModel();
        const blob = await fetchData({ api: `${api}/download/by/id/${id}`, method: "get", action: "return", responseType: "blob" });
        DownloadFile(blob, `${label.toLowerCase()}_${id}.txt`);
    }


    // Download series log file
    async function downloadFile(e) {
        const blob = await fetchData({ api: `logs/download/by/date/${e.target.value}`, method: "get", action: "return", responseType: "blob" });
        DownloadFile(blob, `logs-${e.target.value.replaceAll("-", "")}.zip`);
    }

    const items = searchWord ? list?.filter(x => JSON.stringify(x).toLowerCase().includes(searchWord?.toLowerCase())) : list;

    // if (loading && !loading)
    //     return <LinearLoading size={30} msg="Var vänlig vänta, data hämtas ..." cls="curtain" />

    return (
        <>
            {/* Tab menu */}
            <TabPanel primary={loading ? <Skeleton variant="rectangular" animation="wave" width={200} height={30} /> : label}
                secondary={loading ? "Data hämtning pågår ..." : loaded?.secondaryLabel} >

                {/* If account is blocked */}
                {!loading && <div className="d-row">
                    {!!fields && <Button style={{ minWidth: "120px" }} variant='outlined' color={open ? "error" : "primary"} disabled={loading} onClick={() => setOpen((open) => !open)}>
                        {open ? "Avryt" : "Lägg till ny"}
                    </Button>}

                    {/* Search filter */}
                    {search && <SearchFilter
                        disabled={loading || response}
                        onSearch={(value) => setSearchWord(value)}
                        onReset={() => setSearchWord(null)} />}
                </div>}


                {/* Button to download app log by date */}
                {download && <>
                    <input
                        type="date"
                        className="none"
                        onChange={downloadFile}
                        disabled={pending}
                        ref={inputDate}
                        min={minDate}
                        max={maxDate}
                    />
                    <Tooltip title="Ladda ner app logg fil" classes={{
                        tooltip: "tooltip-info margin",
                        arrow: "tooltip-arrow-info"
                    }} arrow>
                        <IconButton color="primary" className="blink-color" style={{ marginRight: "-10px", marginLeft: "10px" }} onClick={() => inputDate.current?.showPicker()} disabled={pending} >
                            <Download />
                        </IconButton>
                    </Tooltip>
                </>}
            </TabPanel>

            {/* Pagination */}
            {!open && pagination}

            {/* Confirm/Form block */}
            {!!fields && <CollapseForm open={open} fieldsName={fields} api={api} onClose={() => setOpen(false)} />}

            {/* Confirm message and response */}
            <Collapse className="collapse w-100" in={confirmId || response}>
                {/* Confirm */}
                {!!confirmId && <ConfirmButtons
                    question="Radera?"
                    onConfirm={removeConfirmedItem}
                    disabled={pending}
                    onCancel={() => setConfirmId(null)} />}

                {/* Response */}
                {!!response && <Message res={response} cancel={() => handleResponse()} />}
            </Collapse>

            {(!open && (items?.length > 0 && !loading)) && <List className="d-row list-container w-100">
                {/* Loop of result list */}
                {items?.filter((x, index) => (index + 1) > perPage * (page - 1) && (index + 1) <= (perPage * page))?.map((item, ind) => {
                    const onClickProps = !!item?.link ? { onClick: () => navigate(item?.link) } : null;

                    return <Fragment key={ind}>
                        {/* List item */}
                        <ListItem
                            className={`list-item${fullWidth || ((ind + 1) === items?.length && (items?.length % 2) !== 0) ? " w-100 last" : ""}
                                        ${collapsedIndex === ind ? " dropdown" : (typeof collapsedIndex === "number" && collapsedIndex < ind ? " fade-out" : "")}`}
                            secondaryAction={
                                <div className="d-row">

                                    {/* View item in modal */}
                                    {modal && <IconButton color="primary" onClick={() => setModel(item)}>
                                        <Pageview />
                                    </IconButton>}

                                    {/* Download button */}
                                    {download && <IconButton onClick={() => onDownload(item?.id)}>
                                        <Download />
                                    </IconButton>}

                                    {/* Dropdown and delete button */}
                                    {dropdown
                                        ? <IconButton onClick={() => handleDropdown(ind)} disabled={item?.values?.length === 0}>
                                            {collapsedIndex === ind ? <ArrowDropUp /> : <ArrowDropDown />}
                                        </IconButton>
                                        : <IconButton onClick={() => setConfirmId(item?.id)} color="error" disabled={confirmId || open || loading || pending || disabled}>
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
                        {item?.values?.length > 0 &&
                            <Collapse in={collapsedIndex === ind} className='d-row dropdown-block w-100' timeout="auto" unmountOnExit>
                                <List style={{ margin: "0 20px" }}>
                                    {item?.values?.map((item, index) => {
                                        const collapseProps = !!item?.link ? { onClick: () => navigate(item.link) } : null;
                                        return <ListItem className="w-100" key={index} {...collapseProps}>
                                            <ListItemIcon>
                                                <CalendarMonth />
                                            </ListItemIcon>
                                            <ListItemText primary={item?.primary} secondary={item?.secondary} />
                                        </ListItem>
                                    })}
                                </List>
                            </Collapse>}
                    </Fragment>
                })}
            </List>}

            {/* If list is empty */}
            {(!open && (!list || list?.length == 0 || loading)) && <ListLoading rows={1} pending={loading} />}

            {/* Modal overview */}
            {modal && <ModalOverview item={{ ...model, secondary: model?.hidden ?? model?.secondary }} open={!!model} onClose={() => setModel()}>
                {/* Download button */}
                {download && <IconButton onClick={() => onDownload(model?.id)}>
                    <Download />
                </IconButton>}
            </ModalOverview>}
        </>
    )
}

export default Catalog