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
                <List>
                    {historyList.map((h, index) => (
                        <ListItem key={index} style={{display: "block"}}>
                            <ListItemText style={{ width: "100%" }} onClick={() => h.users?.length > 0 ? setDropdown(!dropdown) : openSessionHistory(h.username)}
                                primary={h.username.replace("%", " ")}
                                secondary={h.password ? ("Lösenord: " + h.password) : ("Elever: " + h.users.length)} />

                            {/* If is class members */}
                            {h.users?.length > 0 && <List style={{ width: "97%", margin: "auto" }} className={`dropdown-div ${dropdown ? "dropdown-open" : ""}`}>
                                {h.users.map((x, ind) => (
                                    <ListItem key={index} className='search-result'>
                                        <ListItemText onClick={() => openSessionHistory(x.username)}
                                            primary={x.username.replace("%", " ")}
                                            secondary={"Lösenord: " + x.password} />
                                    </ListItem>))}
                            </List>}
                        </ListItem>
                    ))}
                </List>
                :
                /* If history list is empty */
                <Alert className='alert' severity="warning">
                    <AlertTitle>Ingen tillgänlig session historik</AlertTitle>
                    Kanske det var inte ändrat något lösenord under session.
                </Alert>
            }
        </div>
    )
}
