

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Installed
import {
    Avatar, Button, Checkbox, List, ListItem,
    ListItemAvatar, ListItemText, Tooltip, Typography
} from '@mui/material'
import { Cancel, DeleteSweep, Deselect, Edit, SelectAll } from '@mui/icons-material';

// Components
import Loading from './Loading';
import Response from './Response';
import Info from './Info';

function Result({ list, clsStudents, isVisibleTips, loading, response, disabled, cancelRequest, resetResult, resultBlock }) {
    Result.displayName = "Result";

    const [selectedList, setSelectedList] = useState([]);
    const [isOpenTip, setIsOpenTip] = useState(false);

    const navigate = useNavigate();
    const sl = selectedList.length;
    const selected = (list?.length === sl);
    const refResult = useRef(null);
    const refCheckbox = useRef([]);

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
        navigate(selectedList?.length > 1 ? `/manage-users/${list[0].office}/${list[0].department}` : "/manage-user/" + (user?.name ? user?.name : selectedList[0]));
    }

    // Update session data
    const updateSession = () => {
        // Save found result i sessionStorage
        sessionStorage.setItem("users", JSON.stringify(list));
        sessionStorage.setItem("selectedList", JSON.stringify(selectedList));
        sessionStorage.setItem("selectedUsers", JSON.stringify(list?.filter(x => selectedList.some(s => s === x.name))));
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
                    secondary={loading ? "Sökning pågår ..." : (list?.length > 0 ? ("Hittades: " + list?.length + " användare")
                        : "Ditt sökresultat kommer att visas här nedan")} />

                {/* Hidden form to reset selected users password */}
                {clsStudents && list?.length > 0 && linkButton}

                {/* Cancel request */}
                {loading && <Button
                    variant='contained'
                    color="error"
                    className='button-action'
                    onClick={cancelRequest}>
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
                            disabled={loading || !list} >
                            <DeleteSweep /></Button>
                    </span>
                </Tooltip>
            </ListItem>}


            {/* Visible image under search progress// && users && users.length === 0 */}
            {loading && <Loading />}

            {/* Select or deselect all users in class members list */}
            {clsStudents && list?.length > 0 &&
                /* Hidden form to reset selected users password */
                <List className='w-100'>
                    {/* Select or deselect all list */}
                    <ListItem className='search-result-select'>
                        <ListItemAvatar>
                            <Avatar>
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
            {list?.length > 0 && list?.map((s, index) => (
                <div className='w-100' key={index}>
                    
                    {/* Name of department and office */}
                    {(index === 0 || (index > 0 && list[index - 1].department !== list[index].department)) &&
                        <Typography mt={2} mb={1} variant="body2">
                            {s.office + ((s.office !== s.department) ? " " + s.department : "")} {clsStudents && <span className='typography-span'>{list.filter(x => x.department === s.department)?.length} elever</span>}
                        </Typography>}

                    {/* List object */}
                    <Info
                        user={s}
                        displayName={s.displayName}
                        subTitle={s.office + " " + (s.office !== s.department ? (" " + s?.department) : "")}
                        result={true}
                        check={index === 0}
                        disabled={disabled}
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
                </div>
            ))}

            {/* Message if result is null */}
            {(!loading && response) && <Response res={response} reset={resetResult} />}
        </div>
    )
}

export default Result;