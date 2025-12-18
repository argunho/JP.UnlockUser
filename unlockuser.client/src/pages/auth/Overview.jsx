import { use, useEffect, useRef } from 'react';

// Installed
import {  useOutletContext } from 'react-router-dom';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';

// Components

// Functions
import { Claim } from './../../functions/DecodedToken';

// Storage


function Overview() {

    const { id, collections } = useOutletContext();

    const groups = Claim("groups").split(",");
    const user = groups.flatMap(g => collections[g.name.toLowerCase()]).find(x => x.name === id);

    return <>
        <List>
            {Object.keys(user).map((key, index) => {
                return <ListItem key={index}>
                        <ListItemAvatar>
                            <Avatar>
                                <ChevronRight />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={user[key]} />
                </ListItem> 
            })}
        </List>
    </>
}

export default Overview;
