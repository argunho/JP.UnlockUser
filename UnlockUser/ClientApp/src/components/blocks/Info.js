import { KeyboardReturnTwoTone } from '@mui/icons-material'
import { Avatar, Button, List, ListItem, ListItemAvatar, ListItemText, Tooltip, Typography } from '@mui/material'
import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import SessionCheck from '../functions/SessionCheck';

export default function Info({ user, name, displayName, subTitle, result, check, children, updateSession, handleOutsideClick }) {
    const history = useHistory(null);
    const group = sessionStorage.getItem("group").toLowerCase();
    const refGetMembers = useRef(null);
    const refButton = useRef(null);

    const isDisabled = (!user || group !== "students" || (typeof children === 'object')
        || !(user.office?.length > 0 && user.department?.length > 0));

    // Check current user authentication
    if(check)
        SessionCheck();

    const clickHandle = (e) => {
        if (!result && refButton?.current && refButton?.current.contains(e?.target)) {
            history.goBack();
            return;
        } else if (!isDisabled && refGetMembers?.current && refGetMembers?.current.contains(e?.target)) {
            if (result)
                updateSession();
            history.push(`/members/${user.office}/${user.department}`);
            return;
        }

        if (result)
            handleOutsideClick(e);
    }

    const infoBlock = <ListItem className={(result ? "list-link" : "info-block")} onClick={(e) => clickHandle(e, user)}>
        <ListItemAvatar>
            <Avatar className="user-avatar">
                <img className={`${group}-avatar`} src={require(`./../../images/${group}.png`)} alt="unlock user" />
            </Avatar>
        </ListItemAvatar>
        {/* Users data */}
        <ListItemText
            primary={user?.name || name}
            secondary={
                <React.Fragment>
                    {user && user?.email && <span className='typography-email-span'>{user.email}</span>}
                    {displayName && <Typography
                        sx={{ display: 'inline' }}
                        component="span"
                        variant="body2"
                        color="primary">
                        {displayName}
                    </Typography>}
                    {subTitle && <Tooltip arrow
                        disableHoverListener={isDisabled}
                        title={`Sök efter studenter från ${subTitle}`}>
                        <span className='typography-span' ref={refGetMembers}>{subTitle}</span>
                    </Tooltip>}
                </React.Fragment>} />

        {/* Go back */}
        {!result && <Button
            variant="text"
            ref={refButton}
            title="Go back">
            <KeyboardReturnTwoTone />
        </Button>}

        {/* Props children */}
        {(result && children) && children}
    </ListItem>;

    // Print out user's info
    return (children ? infoBlock :
        <List className='info-wrapper'> {infoBlock} </List>
    )
}
