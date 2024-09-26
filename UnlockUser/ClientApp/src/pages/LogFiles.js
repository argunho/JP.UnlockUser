
import React, { useEffect, useState } from 'react';

//  Installed
import { CancelOutlined, Close, FileOpen, Remove, SearchOffSharp, SearchSharp, Upload } from '@mui/icons-material';
import { Avatar, Button, IconButton, List, ListItem, ListItemAvatar, ListItemText, TextField } from '@mui/material';
import moment from "moment";

// Components
import Response from './../components/Response';
import Loading from './../components/Loading';
import ModalHelpTexts from './../components/ModalHelpTexts'

// Functions
import SessionTokenCheck from './../functions/SessionTokenCheck';

// Services
import ApiRequest from '../services/ApiRequest';

function LogFiles() {
    LogFiles.displayName = "LogFiles";

    const [list, setList] = useState([]);
    const [initList, setInitList] = useState([])
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [viewFile, setFileView] = useState();

    // Check current user authentication
    SessionTokenCheck("/");

    useEffect(() => {
        if (list.length === 0) {
            async function getLogFiles() {
                await ApiRequest("data/logFiles").then(res => {
                    if (res.data !== null)
                        setList(res.data);
                    setLoading(false);
                    setInitList(res.data);
                }, error => console.error(error))
            }
            getLogFiles();
        }

        document.title = "UnlockUser | Loggfiler";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const valueChangeHandler = (e) => {
        if (!e?.target) return;
        setFilter(e.target.value);
        let list = initList.filter(x => x?.toLowerCase().includes(e.target.value?.toLowerCase().replace(" ", "_").replace(/[:-]/g, "")));
        setList(e.target.value?.length === 0 ? initList : list);
    }

    const resetFilter = (e) => {
        setList(initList);
        setFilter("");
    }

    const handleFile = async (file, download = false) => {
        const fileDownload = require('react-file-download');
        await ApiRequest("data/readTextFile/" + file).then(res => {
            console.log(res.data)
            if (res.status === 200) {
                if (download)
                    fileDownload(res.data, file.slice(file.lastIndexOf("_") + 1) + ".txt");
                else
                    setFileView(res.data.replaceAll("\n", "</br>"));
            }
            else
                console.error(res.data);
        }, error => console.error(error))
    }

    return (
        <div className='interior-div'>

            {/* Search filter */}
            <div className='search-wrapper-logs'>
                <TextField
                    label="Sök loggfil ..."
                    className='search-full-width'
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
                    secondary={loading ? "Sökning pågår, loggfiler kommer att visas här nedan ..."
                        : "Hittades: " + list?.length + " loggfiler"} />
            </ListItem>

            {/* Loop of list */}
            {(list?.length > 0 && !viewFile) &&
                <List sx={{ width: '100%' }}>
                    {list.map((s, index) => (
                        /* List object */
                        <ListItem key={index} className="list-link link-files" onClick={() => handleFile(s)}
                            secondaryAction={<IconButton onClick={() => handleFile(s, true)} color="primary"><Upload /></IconButton>}>
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

            {/* View log file content in the modal window */}
            {viewFile && <ModalHelpTexts data={viewFile} isTable={true} view={true} isTitle="Logfilen">
                <IconButton onClick={() => setFileView()}>
                    <Close color="error" />
                </IconButton>
            </ModalHelpTexts>}

            {/* Loading symbol */}
            {loading && <Loading msg="söker efter loggfiler." />}

            {/* Message if result is null */}
            {(list.length === 0 && !loading) &&
                <Response response={{ alert: "info", msg: "Här finns inga loggfiler" }} reset={resetFilter} />}
        </div>
    )
}

export default LogFiles;
