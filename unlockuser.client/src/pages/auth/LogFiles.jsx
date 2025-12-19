
import { useEffect, useState } from 'react';

//  Installed
import { Close, FileOpen, Upload } from '@mui/icons-material';
import { Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import moment from "moment";
import fileDownload from 'js-file-download';
import { useLoaderData, useOutletContext } from 'react-router-dom';

// Components
import Message from '../../components/blocks/Message';
import Loading from '../../components/Loading';
import ModalPreview from '../../components/modals/ModalPreview'
import SearchFilter from '../../components/forms/SearchFilter';

// Functions
import { ErrorHandle } from '../../functions/ErrorHandle';

// Services
import { ApiRequest } from '../../services/ApiRequest';

function LogFiles() {

    const [viewFile, setFileView] = useState(null);
    const [value, setSearchValue] = useState(null)

    const { list } = useLoaderData();
    const { loading, id } = useOutletContext();

    useEffect(() => {
        document.title = `UnlockUser | Logfiler`;
    }, [])


    const handleFile = async (file, download = false) => {
        // const fileDownload = require('js-file-download');
        await ApiRequest("api/data/read/file/" + file).then(res => {
            if (res.status === 200) {
                if (download)
                    fileDownload(res.data, file.slice(file.lastIndexOf("_") + 1) + ".txt");
                else
                    setFileView(res.data.replaceAll("\n", "</br>"));
            }
            else
                console.error(res.data);
        }, error => ErrorHandle(error));
    }

    return (
        <div className='interior-div'>

            {/* Search filter */}
            <SearchFilter label="Logfil" onChange={(value) => setSearchValue(value)} onReset={() => setSearchValue(null)} />

            {/* Result info box */}
            <ListItem className='search-result'>
                {/* Result info */}
                <ListItemText
                    primary={id === "history" ? "Detaljerad historia" : "Loggfiler"}
                    secondary={loading ? "Data hämtning pågå ..." : `Antal: ${list?.length}`} />
            </ListItem>

            {/* Loop of list */}
            {(list?.length > 0 && !viewFile) &&
                <List sx={{ width: '100%' }}>
                    {list.filter(x => x?.toLowerCase().includes(value?.toLowerCase().replace(" ", "_").replace(/[:-]/g, "")))?.map((s, index) => (
                        /* List object */
                        <ListItem key={index} className="list-link link-files" onClick={() => handleFile(s)}
                            secondaryAction={<IconButton onClick={() => handleFile(s, true)} color="primary"><Upload /></IconButton>}>
                            <div className='links-wrapper'>
                                {/* Avatar */}
                                <ListItemAvatar>
                                    <Avatar>
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
            {!!viewFile && <ModalPreview data={viewFile} isTable={true} view={true} isTitle="Logfilen">
                <IconButton onClick={() => setFileView()}>
                    <Close color="error" />
                </IconButton>
            </ModalPreview>}

            {/* Loading symbol */}
            {loading && <Loading msg="söker efter loggfiler." />}

            {/* Message if result is null */}
            {(list.length === 0 && !loading) &&
                <Message res={{ color: "info", msg: "Här finns inga loggfiler" }} />}
        </div>
    )
}

export default LogFiles;
