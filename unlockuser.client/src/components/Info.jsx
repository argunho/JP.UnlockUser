

import { useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Installed
import { ArrowRight, EventNote, KeyboardReturnTwoTone, School } from '@mui/icons-material'
import { Avatar, Button, List, ListItem, ListItemAvatar, ListItemText, Tooltip, Typography } from '@mui/material'

// Services
import { AuthContext } from '../storage/AuthContext';

function Info({ children, user, name, displayName, subTitle, result, disabled, updateSession, handleOutsideClick }) {
    Info.displayName = "Info";

    const navigate = useNavigate(null);
    const authContext = useContext(AuthContext);

    const refGetMembers = useRef(null);
    const group = authContext.group?.toLowerCase();

    const isDisabled = (!user || group?.toLowerCase() !== "studenter" || (typeof children === 'object')
        || !(user.office?.length > 0 && user.department?.length > 0));

    const clickHandle = (e) => {
        if (disabled) return;

        if (!isDisabled && refGetMembers?.current && refGetMembers?.current.contains(e?.target)) {
            if (result)
                updateSession();
            navigate(`/members/${user.office}/${user.department}`);
            return;
        }

        if (result)
            handleOutsideClick(e);
    }

    const infoBlock = <ListItem className={(result ? "list-link" : "info-block")} onClick={(e) => clickHandle(e, user)}
        secondaryAction={!result && <Button className='back-button' onClick={() => navigate(-1)} title="Go back">
            <KeyboardReturnTwoTone />
        </Button>}>

        <ListItemAvatar>
            <Avatar>
                {group === "studenter" ? <School /> : <EventNote />}
            </Avatar>
        </ListItemAvatar>

        {/* Users data */}
        <ListItemText
            primary={user?.name || name}
            secondary={
                <>
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

                    {/* If a user has a managers list */}
                    {user?.managers?.length > 0 && <span className='d-row'>
                        <Typography sx={{ marginRight: "15px" }} variant="caption" color="-moz-initial">Chef: </Typography>
                        {user.managers?.map((x, ind) => {
                            return <Typography
                                sx={{ margin: "3px" }}
                                variant="caption" key={ind} disabled>
                                <span title={x.username}>{x.displayName} {((ind + 1) < user.managers?.length) && <ArrowRight />}</span>
                            </Typography>
                        })}
                    </span>}
                </>} />


        {/* Props children */}
        {(result && children) && children}
    </ListItem>;

    // Print out user's info
    return (
        children ? infoBlock : <List className='info-wrapper'> {infoBlock} </List>
    )
}

export default Info;