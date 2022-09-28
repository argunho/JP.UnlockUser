import { FileOpen, SearchOffSharp, SearchSharp } from '@mui/icons-material';
import { Avatar, Button, List, ListItem, ListItemAvatar, ListItemText, TextField } from '@mui/material'
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Response from '../blocks/Response';
import Loading from '../blocks/Loading';
import TokenConfig from '../functions/TokenConfig';
import moment from "moment";
import SessionCheck from '../functions/SessionCheck';
// import { saveAs } from "file-saver";

export default function LogFiles() {
    LogFiles.displayName = "LogFiles";

    const [list, setList] = useState([]);
    const [initList, setInitList] = useState([])
    const [filter, setFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Check current user authentication
    SessionCheck("/");

    useEffect(() => {
        if (list.length === 0) {
            axios.get("data/logFiles", TokenConfig()).then(res => {
                if (res.data !== null)
                    setList(res.data);
                setIsLoading(false);
                setInitList(res.data);
            }, error => console.error(error))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const valueChangeHandler = (e) => {
        if (!e?.target) return;
        setFilter(e.target.value);
        let list = initList.filter(x => x.toLowerCase().includes(e.target.value.toLowerCase().replace(" ", "_").replace(/[:-]/g, "")));
        setList(e.target.value?.length === 0 ? initList : list);
    }

    const resetFilter = (e) => {
        setList(initList);
        setFilter("");
    }

    const downloadFile = async (file) => {
        // saveAs(
        //     "https://unlock.alvesta.se/logfiles/students20220811114001.txt",
        //     file + ".md"
        // )

        const fileDownload = require('react-file-download');
        await axios.get("data/readTextFile/" + file, TokenConfig()).then(res => {
            if (res.status === 200)
                fileDownload(res.data, file.slice(file.lastIndexOf("_") + 1) + ".txt");
            else
                console.error(res.data);
        }, error => console.error(error))
    }

    return (
        <div className='interior-div'>
            <div className='search-wrapper'>
                <TextField
                    label="Sök loggfil ..."
                    className='search-input'
                    value={filter}
                    placeholder="Anvädarnamn, school, klass, datum, gruppnamn ..."
                    onChange={valueChangeHandler}
                />

                {/* Disabled button */}
                <Button
                    variant="outlined"
                    color="inherit"
                    className="search-button search-button-mobile"
                    type="button"
                    disabled={true}>
                    <SearchSharp /></Button>

                {/* Reset form - button */}
                {list !== initList && <Button
                    variant="text"
                    color="error"
                    className="search-reset search-button-mobile"
                    onClick={resetFilter}>
                    <SearchOffSharp />
                </Button>}
            </div>

            {/* Result info box */}
            <ListItem className='search-result'>
                {/* Result info */}
                <ListItemText
                    primary="Result"
                    secondary={isLoading ? "Sökning pågår, loggfiler kommer att visas här nedan ..."
                        : "Hittades: " + list?.length + " loggfiler"} />
            </ListItem>

            {/* Loop of list */}
            {list?.length > 0 &&
                <List sx={{ width: '100%' }}>
                    {list.map((s, index) => (
                        /* List object */
                        <ListItem key={index} className="list-link link-files" onClick={() => downloadFile(s)}>
                            <div className='links-wrapper'>
                                {/* Avatar */}
                                <ListItemAvatar>
                                    <Avatar className="user-avatar">
                                        <FileOpen />
                                    </Avatar>
                                </ListItemAvatar>

                                {/* User data */}
                                <ListItemText
                                    primary={moment(s.substr(s.lastIndexOf("_") + 1, 8), 'YYYY-MM-DD hh:mm:ss').format('YYYY-MM-DD')}
                                    secondary={<span style={{ fontSize: 10 }}>{moment(s.slice(s.lastIndexOf("_") + 9), 'hh:mm:ss').format('HH:mm:ss')}</span>} />
                            </div>
                        </ListItem>
                    ))}
                </List>}

            {/* Loading symbol */}
            {isLoading && <Loading msg="söker efter loggfiler." />}

            {/* Message if result is null */}
            {(list.length === 0 && !isLoading) && <Response response={{ alert: "info", msg: "Här finns inga loggfiler" }} />}
        </div>
    )
}
