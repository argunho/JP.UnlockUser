import React, { useState } from 'react'
import { History } from '@mui/icons-material';
import { Alert, AlertTitle, Avatar, Button, List, ListItem, ListItemAvatar, ListItemText, Tooltip, Typography } from '@mui/material';
import { useHistory } from 'react-router-dom';
import SessionPasswordsList from '../functions/SessionPasswordsList';

export default function SessionHistory() {
    History.displayName = "History";


    const [dropdown, setDropdown] = useState(false);
    const historyList = SessionPasswordsList();
    const history = useHistory()


    // Go to the current session history log page
    const openSessionHistory = (name) => {
            history.push(`/manage-user/${name}`);
    }

    // historyList.length > 0 &&
    // <>
    //     <Button variant='text' onClick={() => setDropdown(!dropdown)} color={dropdown ? "primary" : "inherit"}>
    //         Historik &nbsp;&nbsp;{dropdown ? <ArrowDropUp /> : <ArrowDropDown />}
    //     </Button>
    //     <ul className={`selected-list history-list dropdown-div ${dropdown ? "dropdown-open" : ""}`}>
    //         {SessionPasswordsList().map((x, index) => (
    //             <Tooltip arrow
    //                 key={index}
    //                 title={x.users?.length > 0 ? x.users.map((y, ind) => (
    //                     <pre key={ind}><b><font color='#000000'>{y.username} :</font></b> {y.password}</pre>
    //                 )) : <pre><b><font color='#000000'>Lösenord : </font></b> {x.password}</pre>}
    //                 classes={{ tooltip: "tooltip tooltip-blue tooltip-margin", arrow: "arrow-blue" }}>
    //                 <li onClick={() => openSessionHistory(x.username, x.users)}>
    //                     {x.username.replace("%", " ")}
    //                 </li>
    //             </Tooltip>
    //         ))}
    //     </ul>
    // </>
    return (
        <div className='interior-div result-div'>
            <List className='search-result'>
                {/* Select or deselect all list */}
                <ListItem className='search-result-select'>
                    <ListItemAvatar>
                        <Avatar className="user-avatar"><History /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary={`Session historik`}
                        secondary={`Ändrade lösenord under sessionen. Antal ${historyList.length}`}
                    />
                </ListItem>
            </List>

            {historyList.length > 0 ?
                /* If history list exists */
                historyList.map((h, index) => (
                    <ListItem key={index}>
                        <ListItemText onClick={() => h.users?.length > 0 ? setDropdown(!dropdown) : openSessionHistory(h.username)}
                            primary={h.username.replace("%", " ")}
                            secondary={h.password} />

                        {/* If is class members */}
                        {h.users?.length > 0 && <List className={`selected-list history-list dropdown-div ${dropdown ? "dropdown-open" : ""}`}>
                            {h.users.map((x, ind) => (
                                <ListItem key={index}>
                                    <ListItemText onClick={() => openSessionHistory(x.username)}
                                        primary={h.username.replace("%", " ")}
                                        secondary={h.password} />
                                </ListItem>))}
                        </List>}
                    </ListItem>
                )) :
                /* If history list is empty */
                <Alert className='alert' severity="warning">
                    <AlertTitle>Ingen tillgänlig session historik</AlertTitle>
                    Kanske det var inte ändrat något lösenord under session.
                </Alert>
            }
        </div>
    )
}
