import React, { useEffect, useState } from 'react';

// Installed
import { Box, Button, FormControl, IconButton, InputLabel, List, ListItem, ListItemIcon, ListItemText, MenuItem, Pagination, Select } from '@mui/material';
import { ListOutlined, OpenInFull, Update } from '@mui/icons-material';

// Components
import SearchFilter from '../components/SearchFilter';
import Response from '../components/Response';
import Loading from '../components/Loading';

// Services
import ApiRequest from '../services/ApiRequest';

// Css
import '../assets/css/listview.css';

function ViewList() {
    ViewList.displayName = "ViewList";

    const [initList, setInit] = useState([]);
    const [list, setList] = useState([]);
    const [response, setResponse] = useState();
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState([]);
    const [group, setGroup] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [count, setCount] = useState(1);
    const [data, setData] = useState();
    const [listLength, setListLength] = useState(0);

    const noResult = { alert: "info", msg: "Inga personal hittades." };

    useEffect(() => {


        getData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        console.log(group)
        setList([]);
        setTimeout(() => {
            getListPerGroup(1);
        }, 100)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group])

    async function getData() {
        setLoading(true);
        await ApiRequest("app/authorized/personnel").then(response => {
            const res = response.data;
            setInit(res)
            console.log(res)
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

    function getListPerGroup(number) {
        const groupList = initList?.find(x => x.group?.name === group)?.employees;
        setListLength(groupList?.length);
        let pagesCount = (groupList?.length / perPage).toFixed();
        setCount(pagesCount);
        const listPerPage = number === 1
            ? groupList.filter((x, index) => index < perPage)
            : (number === pagesCount ? groupList.filter((x, index) => index >= (perPage * number))
                : groupList.filter((x, index) => index >= (perPage * number) && index < (perPage * (number + 1))));
        setList(listPerPage);
        setLoading(false);
    }

    function valueChangeHandler(value) {
        let groupList = initList.find(x => x.group?.name === group)?.employees ?? [];
        if (value !== "") {
            let list = groupList?.filter(x => (x?.name || x?.division || x?.office || x?.email || x.displayName)?.toLowerCase().includes(value));
            setList(value?.length === 0 ? initList : list);
        } else
            resetActions();
    }

    function handlePageChange(e, value) {
        setPage(value);
        getListPerGroup(value);
    }

    async function renewList() {
        setLoading(true);
        setListLength(0);
        await ApiRequest("app/renew/authorized/personnel/list").then(res => {
            if (res.status === 200)
                getData();
            else
                setLoading(false);
        }, error => {
            setResponse({ alert: "warning", msg: `Något har gått snett: Fel: ${error}` });
            setLoading(false);
        })
    }

    function expandModal(item) {
        setData(item);
    }

    function resetActions() {
        setList(initList?.find(x => x.group?.name === group)?.employees);
        setResponse();
        setLoading(false);
    }

    return (
        <div className='interior-div view-list'>

            <div className="d-row view-list-container search-container">
                {/* Search filter */}
                <SearchFilter label="anställda" disabled={loading || list?.length === 0} onChange={valueChangeHandler} onReset={resetActions} />

                {/* Choose group */}
                <Box sx={{ minWidth: 160, marginBottom: "9px" }}>
                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">Grupper</InputLabel>
                        <Select
                            value={group}
                            labelId="demo-simple-select-label"
                            onChange={(e) => setGroup(e.target.value)}
                            sx={{ height: 50, color: "#1976D2" }}
                            disabled={loading || list?.length === 0}
                        >
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
                <ListItem className='view-list-result' secondaryAction={<Button size='large' variant='outlined' onClick={renewList} endIcon={<Update />}>
                    Updatera listan
                </Button>}>
                    <ListItemText primary="Antal anställda" secondary={listLength} />
                </ListItem>

                {/* Loop of list */}
                {(list?.length > 0 && !loading) && list.map((item, index) => {
                    return <ListItem key={index} className={`list-item w-100`}
                                secondaryAction={<IconButton onClick={() => expandModal(item)}><OpenInFull /></IconButton>}>
                        <ListItemIcon>
                            {page > 1 ? (perPage *(page - 1)) + (index + 1) : index + 1}
                        </ListItemIcon>
                        <ListItemText primary={item?.displayName} secondary={item?.office} />
                    </ListItem>
                })}
            </List>

            {/* Loading symbol */}
            {loading && <Loading msg="data hämtas ..." />}

            {/* Pagination */}
            {(listLength > 0 && !loading) && <div className="pagination">
                <Pagination count={count}
                    page={page} onChange={handlePageChange} variant="outlined" shape="rounded" />
            </div>}

            {/* Message if result is null */}
            {(response && !loading) && <Response response={response} reset={resetActions} />}
        </div>
    )
}

export default ViewList;