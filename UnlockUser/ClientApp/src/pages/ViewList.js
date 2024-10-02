import React, { useEffect, useState } from 'react';

// Installed
import { Box, FormControl, IconButton, InputLabel, List, ListItem, ListItemIcon, ListItemText, MenuItem, Pagination, Select } from '@mui/material';
import { ListOutlined } from '@mui/icons-material';

// Components
import SearchFilter from '../components/SearchFilter';
import Response from '../components/Response';
import Loading from '../components/Loading';

// Services
import ApiRequest from '../services/ApiRequest';

// Css
import '../assets/css/listview.css'

function ViewList() {
    ViewList.displayName = "ViewList";

    const [initList, setInit] = useState([]);
    const [list, setList] = useState([]);
    const [response, setResponse] = useState();
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState([]);
    const [group, setGroup] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(50);

    const noResult = { alert: "info", msg: "Inga personal hittades." };

    useEffect(() => {
        async function getData() {
            setLoading(true);
            await ApiRequest("app/authorized/personnel").then(response => {
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

        getData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        console.log(group)
        setList([]);
        setLoading(true);
        setTimeout(() => {
            resetActions();
        }, 100)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group])

    const valueChangeHandler = (value) => {
        let groupList = initList.find(x => x.group?.name === group)?.employees ?? [];
        if (value !== "") {
            let list = groupList?.filter(x => (x?.name || x?.division || x?.office || x?.email || x.displayName)?.toLowerCase().includes(value));
            setList(value?.length === 0 ? initList : list);
        } else
        resetActions();
    }

    const handlePageChange = (e, value) => {
        setPage(value);
    }

    const resetActions = () => {
        setList(initList?.find(x => x.group?.name === group)?.employees ?? []);
        setResponse();
        setLoading(false);
    }

    return (
        <div className='interior-div'>

            <div className="d-row view-list-container search-container">
                {/* Search filter */}
                <SearchFilter onChange={valueChangeHandler} onReset={resetActions} label="anställda" />

                {/* Choose group */}
                <Box sx={{ minWidth: 160, marginBottom: "9px" }}>
                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">Grupper</InputLabel>
                        <Select
                            value={group}
                            label="Hanteras"
                            labelId="demo-simple-select-label"
                            onChange={(e) => setGroup(e.target.value)}
                            sx={{ height: 50, color: "#1976D2" }}
                            disabled={loading}
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


            {/* Loading symbol */}
            {loading && <Loading msg="data hämtas ..." />}

            {/* Result list */}
            {(list?.length > 0 && !loading) && <List className="d-row list-container">
                {list?.slice(page * perPage, perPage).map((item, index) => {
                    console.log(list.length)
                    return <ListItem key={index} className={`list-item w-100`}
                        secondaryAction={<IconButton>

                        </IconButton>}>
                        <ListItemIcon>
                            <ListOutlined />
                        </ListItemIcon>
                        <ListItemText primary={item?.displayName} secondary={item?.office} />
                    </ListItem>
                })}
            </List>}

            {/* Pagination */}
            {(list?.length > 0 && !loading) && <div className="pagination">
                <Pagination count={(list?.length / perPage).toFixed()}
                    page={page} onChange={handlePageChange} variant="outlined" shape="rounded" />
            </div>}

            {/* Message if result is null */}
            {(response && !loading) && <Response response={response} reset={resetActions} />}
        </div>
    )
}

export default ViewList;