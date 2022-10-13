

import React, { useEffect, useRef, useState } from 'react'
import {
    Avatar, Button, Checkbox, List, ListItem,
    ListItemAvatar, ListItemText, Tooltip, Typography
} from '@mui/material'
import { Cancel, DeleteSweep, Deselect, Edit, SelectAll } from '@mui/icons-material';
import Loading from './Loading';
import { useHistory } from 'react-router-dom';
import Response from './Response';
import Info from './Info';
import SessionPasswordsList from '../functions/SessionPasswordsList'
/* eslint-disable react-hooks/exhaustive-deps */  // <= Do not remove this line


export default function Result({
    list, clsStudents,
    isVisibleTips, isLoading, response,
    cancelRequest, resetResult,
    resultBlock, getHistoryList
}) {

    const refResult = useRef(null);
    const [selectedList, setSelectedList] = useState([]);
    const [isOpenTip, setIsOpenTip] = useState(false);

    const history = useHistory();
    const sl = selectedList.length;
    const selected = (list?.length === sl);
    // const refGetMembers = useRef();
    const refCheckbox = useRef([]);
    // const group = sessionStorage.getItem("group")?.toLowerCase();

    useEffect(() => {
        if (resultBlock)
            refResult.current.scrollIntoView();
    }, [isLoading, list])

    useEffect(() => {
        if (isOpenTip)
            setTimeout(() => { setIsOpenTip(false); }, 2000)
    }, [isOpenTip])

    // To select all from class students list
    const selectList = (selected) => {
        const arr = [];
        if (!selected)
            list?.forEach(u => { arr.push(u.name) });

        setSelectedList(arr);
        setIsOpenTip(arr.length > 0);
    }

    // Navigate to page
    const clickHandle = (e, index, user = null) => {
        if (clsStudents && refCheckbox?.current[index]?.contains(e.target)) {
            handleSelectedList(user.name);
            return;
        }

        updateSession();

        // Navigation
        history.push(user?.name ? "/manage-user/" + user?.name : `/manage-users/${list[0].office}/${list[0].department}`);
    }

    // Update session data
    const updateSession = () => {
        // Save found result i sessionStorage
        sessionStorage.setItem("users", JSON.stringify(list));
        sessionStorage.setItem("selectedList", JSON.stringify(selectedList));
        sessionStorage.setItem("selectedUsers", JSON.stringify(list?.filter(x => selectedList.some(s => s === x.name))));
    }

    // Go to the current session history log page
    const openSessionHistory = (name, arr) => {
        if (arr?.length > 0){
            let params = name.split("%");
            getHistoryList(`${params[1]}/${params[0]}`, arr);
        } else 
            history.push(`/manage-user/${name}`);
    }

    // To select one by one user from the class students' list
    const handleSelectedList = (name) => {
        const arr = selectedList;
        if (arr?.length > 0 && arr.indexOf(name) > -1)
            arr.splice(arr.indexOf(name), 1);
        else arr.push(name);

        // Update selected users
        setSelectedList(arr);
        setIsOpenTip(arr.length > 0);
    }

    // Go to password change page
    const linkButton = <Tooltip arrow
        title={`Klicka här att ställa in nytt lösenord för valda ${sl} elev${sl === 1 && "er"}`}
        classes={{ tooltip: "tooltip tooltip-blue", arrow: "arrow-blue" }}
        open={isOpenTip}>
        <Button
            className='button-action'
            disabled={sl === 0}
            onClick={(e) => clickHandle(e)}
            style={{ marginLeft: "10px" }}>
            <Edit />
            <span>Ändra lösenord</span>
        </Button>
    </Tooltip>;

    return (
        /* Box to view the result of search */
        <div className='interior-div result-div' ref={refResult}>

            {/* Result info box */}
            {resultBlock && <ListItem className='search-result'>
                {/* Result info */}
                <ListItemText
                    primary="Result"
                    secondary={isLoading ? "Sökning pågår ..." : (list?.length > 0 ? ("Hittades: " + list?.length + " användare")
                        : "Ditt sökresultat kommer att visas här nedan")} />

                {/* Hidden form to reset selected users password */}
                {clsStudents && list?.length > 0 && linkButton}

                {/* Cancel request */}
                {isLoading && <Button
                    variant='contained'
                    color="error"
                    className='button-action'
                    onClick={() => cancelRequest()}>
                    <Cancel />
                    <span>Avbryt sökning</span>
                </Button>}

                {/* Button to reset search result */}
                <Tooltip arrow
                    disableHoverListener={!isVisibleTips}
                    title="Ta bort sökresultat."
                    classes={{ tooltip: "tooltip tooltip-error", arrow: "arrow-error" }}>
                    <span>
                        <Button variant="text"
                            color="error"
                            className="reset-button"
                            onClick={() => resetResult()}
                            disabled={isLoading || !list} >
                            <DeleteSweep /></Button>
                    </span>
                </Tooltip>
            </ListItem>}

            {/* Session history */}
            {SessionPasswordsList().length > 0 &&
                <ul className='session-history-list'>
                    {SessionPasswordsList().map((x, index) => (
                        <Tooltip arrow
                            key={index}
                            title={x.users?.length > 0 ? x.users.map((y, ind) => (
                                <pre key={ind}><b><font color='#000000'>{y.username} :</font></b> {y.password}</pre>
                            )) : <pre><b><font color='#000000'>Lösenord : </font></b> {x.password}</pre>}
                            classes={{ tooltip: "tooltip tooltip-blue tooltip-margin", arrow: "arrow-blue" }}>
                            <li onClick={() => openSessionHistory(x.username, x.users)}>
                                {x.username.replace("%", " ")}
                            </li>
                        </Tooltip>
                    ))}
                </ul>}

            {/* Visible image under search progress// && users && users.length === 0 */}
            {isLoading && <Loading />}

            {/* Select or deselect all users in class members list */}
            {clsStudents && list?.length > 0 &&
                /* Hidden form to reset selected users password */
                <List sx={{ width: '100%' }} component="nav">
                    {/* Select or deselect all list */}
                    <ListItem className='search-result-select'>
                        <ListItemAvatar>
                            <Avatar className="user-avatar">
                                {!selected ? <SelectAll /> : <Deselect color="primary" />}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={`${selected ? "Avmarkera" : "Markera"} alla`}
                            secondary={<React.Fragment>
                                <Typography
                                    sx={{ display: 'inline' }}
                                    component="span"
                                    variant="body2"
                                    color="inherit">
                                    {sl} elev{sl === 1 && "er"} har valts
                                </Typography>

                                {!resultBlock && linkButton}
                            </React.Fragment>}
                        />
                        <Checkbox
                            checked={selected}
                            onMouseDown={() => setIsOpenTip(false)}
                            onClick={() => selectList(selected)} />
                    </ListItem>
                </List>}

            {/* Loop of search result list if result is not null */}
            {list?.length > 0 &&
                <List sx={{ width: '100%' }}>
                    {list?.map((s, index) => (
                        /* List object */
                        <Info
                            key={index}
                            user={s}
                            displayName={s.displayName}
                            subTitle={s.office + " " + (s.office !== s.department ? (" " + s?.department) : "")}
                            result={true}
                            check={index === 0}
                            updateSession={updateSession}
                            handleOutsideClick={(e) => clickHandle(e, index, s)}>

                            {/* Checkbox visible only if is success result after users search by class name */}
                            {clsStudents && <Checkbox
                                size='small'
                                color="default"
                                ref={checkbox => refCheckbox.current[index] = checkbox}
                                checked={selectedList.indexOf(s.name) > -1}
                            />}
                        </Info>
                    ))}
                </List>}

            {/* Message if result is null */}
            {(!isLoading && response) && <Response response={response} reset={() => resetResult()} />}
        </div>
    )
}