import React, { useState } from 'react'
import { ArrowDropDown, ArrowDropUp, History } from '@mui/icons-material';
import { Alert, AlertTitle, Avatar, Button, Collapse, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Tooltip, Typography } from '@mui/material';
import { useHistory } from 'react-router-dom';
import SessionPasswordsList from '../functions/SessionPasswordsList';

export default function SessionHistory() {
    History.displayName = "History";


    const [dropdownId, setDropdownId] = useState(null);
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
                        <Avatar><History /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary={`Session historik`}
                        secondary={`Ändrade lösenord under sessionen. Antal ${historyList.length}`}
                    />
                </ListItem>
            </List>

            {historyList.length > 0 ?
                /* If history list exists */
                <List width={{ width: "100%" }}>
                    {historyList.map((h, index) => (
                        <div key={index}>
                            <ListItemButton style={{ width: "100%" }}>
                                <ListItemText onClick={() => h.users?.length > 0 ? setDropdownId((index === dropdownId) ? null : index) : openSessionHistory(h.username)}
                                    primary={h.username.replace("%", " ")}
                                    secondary={h.users.length === 0 ? ("Lösenord: " + h.password) : ("Elever: " + h.users.length)} />
                                {h.users.length > 0 && ((index === dropdownId) ? <ArrowDropUp /> : <ArrowDropDown />)}
                            </ListItemButton>
                            {/* If is class members */}
                            {h.users?.length > 0 && <Collapse in={dropdownId === index} className="history-dropdown-list" timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {h.users.map((x, ind) => (
                                        <ListItem key={ind} className='search-result'>
                                            <ListItemText onClick={() => openSessionHistory(x.username)}
                                                primary={x.username.replace("%", " ")}
                                                secondary={"Lösenord: " + x.password} />
                                        </ListItem>))}
                                </List>
                            </Collapse>}
                        </div>
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
