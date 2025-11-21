

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Installed
import {
    Avatar, Button, Checkbox, List, ListItem,
    ListItemAvatar, ListItemText, Tooltip, Typography
} from '@mui/material'
import { Cancel, DeleteSweep, Deselect, Edit, SelectAll } from '@mui/icons-material';

// Components
import Loading from './Loading';
import Message from './blocks/Message';
import Info from './Info';

const defMessage = "Ditt sökresultat kommer att visas här nedan"

function Result({ list, clsStudents, isVisibleTips, loading, response, disabled, cancelRequest, resetResult, resultBlock }) {
    Result.displayName = "Result";

    const [selectedList, setSelectedList] = useState([]);
    const [isOpenTip, setIsOpenTip] = useState(false);
    const [res, setResult] = useState(defMessage);

    const sl = selectedList.length;
    const selected = (list?.length === sl);

    const refResult = useRef(null);
    const refCheckbox = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (loading)
            setResult("Sökning pågår ...");
    }, [loading])

    useEffect(() => {
        if (list?.length > 0)
            setResult(`Hittades: ${list?.length} användare`);
        else if (list == null)
            setResult(defMessage);
    }, [list])

    useEffect(() => {
        if (!!response)
            setResult(`Hittades 0 användare`);
    }, [response])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpenTip)
                setIsOpenTip(false);
        }, 2000)

        return () => {
            clearTimeout(timer);
        }
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

    const handleResponse = useCallback(function handleResponse() {
        resetResult();
    }, [])

    // Go to password change page
    const linkButton = <Tooltip arrow
        title={`Klicka här att ställa in nytt lösenord för valda ${sl} elev${sl === 1 && "er"}`}
        classes={{ tooltip: "tooltip tooltip-blue", arrow: "arrow-blue" }}
        open={isOpenTip}>
        <Button
            className='button-action'
            disabled={sl === 0}
            onClick={(e) => clickHandle(e)}
            style={{ marginLeft: "10px" }}
            startIcon={<Edit />}
            variant="contained">
            Ändra lösenord
        </Button>
    </Tooltip>;



    return (
        /* Box to view the result of search */
        <div className='interior-div result-div' ref={refResult}>

            {/* Result info box */}
            {resultBlock && <ListItem className='view-list-result' secondaryAction={
                <>
                    {/* Hidden form to reset selected users password */}
                    {(clsStudents && list?.length > 0) && linkButton}

                    {/* Cancel request */}
                    {loading && <Button
                        variant='contained'
                        color="error"
                        className='button-action'
                        onClick={cancelRequest}
                        startIcon={<Cancel />}>
                        Avbryt sökning
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
                                onClick={resetResult}
                                disabled={loading || !list} >
                                <DeleteSweep /></Button>
                        </span>
                    </Tooltip>
                </>
            }>
                {/* Result info */}
                <ListItemText primary="Resultat" secondary={res} />

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
                            secondary={<>
                                <Typography
                                    sx={{ display: 'inline' }}
                                    component="span"
                                    variant="body2"
                                    color="inherit">
                                    {sl} elev{sl === 1 && "er"} har valts
                                </Typography>

                                {!resultBlock && linkButton}
                            </>}
                        />
                        <Checkbox
                            checked={selected}
                            onMouseDown={() => setIsOpenTip(false)}
                            onClick={() => selectList(selected)} />
                    </ListItem>
                </List>}

            {/* Loop of search result list if result is not null */}
            {list?.length > 0 && list?.map((user, index) => (
                <div className='w-100' key={index}>

                    {/* Name of department and office */}
                    {(index === 0 || (index > 0 && list[index - 1].department !== list[index].department)) &&
                        <Typography mt={2} mb={1} variant="body2">
                            {user.office + ((user.office !== user.department) ? " " + user.department : "")} {clsStudents && <span className='typography-span'>{list.filter(x => x.department === user.department)?.length} elever</span>}
                        </Typography>}

                    {/* List object */}
                    <Info
                        user={user}
                        displayName={user.displayName}
                        subTitle={user.office + " " + (user.office !== user.department ? (" " + user?.department) : "")}
                        result={true}
                        disabled={disabled}
                        updateSession={updateSession}
                        handleOutsideClick={(e) => clickHandle(e, index, user)}>

                        {/* Checkbox visible only if is success result after users search by class name */}
                        {clsStudents && <Checkbox
                            size='small'
                            color="default"
                            ref={checkbox => refCheckbox.current[index] = checkbox}
                            checked={selectedList.indexOf(user.name) > -1}
                        />}
                    </Info>
                </div>
            ))}

            {/* Message if result is null */}
            {(!loading && response) && <Message res={response} cancel={handleResponse} />}
        </div>
    )
}

export default Result;