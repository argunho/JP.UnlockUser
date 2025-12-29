

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Installed
import {
    Avatar, Button, Checkbox, List, ListItem, IconButton,
    ListItemAvatar, ListItemText, Tooltip, Typography
} from '@mui/material'
import { Close, Deselect, Edit, SelectAll, List as ListView } from '@mui/icons-material';

// Components
import Message from './Message';
import Info from './Info';
import ListLoading from './../lists/ListLoading';

function ResultView({ list, isClass, disabled, group, loading, onReset, resultBlock }) {

    const [selectedList, setSelectedList] = useState([]);
    const [isOpenTip, setIsOpenTip] = useState(false);

    const sl = selectedList.length;
    const selected = (list?.length === sl);

    const refResult = useRef(null);
    const refCheckbox = useRef([]);
    const navigate = useNavigate();

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
        if (isClass && refCheckbox?.current[index]?.contains(e.target)) {
            handleSelectedList(user.name);
            return;
        }

        // Navigation
        navigate(selectedList?.length > 1 
            ? `/manage/${group}/class/${list[0].office}/${list[0].department}` 
            : `/manage/${group}/user/` + (user?.name ? user?.name : selectedList[0]));
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
            style={{ marginLeft: "10px" }}
            startIcon={<Edit />} >
            Ändra lösenord
        </Button>
    </Tooltip>;

    return (
        /* Box to view the result of search */
        <div className='result-div' ref={refResult}>

            {/* Result info box */}
            {resultBlock && <div className='d-row jc-between w-100 view-list-result'>
                {/* Result info */}
                <div className="vlr-info d-column ai-start">
                    <span>Resultat</span>
                    <span className="d-row jc-start">
                        {list?.length > 0 && <ListView size="small" color="primary" style={{ marginRight: 10 }} />}
                        {list ? `${list?.length} användare` : "*****************"}
                    </span>
                </div>

                <div className="d-row">
                    {/* Hidden form to reset selected users password */}
                    {(isClass && list?.length > 0) && linkButton}

                    {/* Button to reset search result */}
                    {list?.length > 0 && <Tooltip
                        title="Rensa sökresultaten."
                        classes={{ tooltip: "tooltip tooltip-red", arrow: "tooltip-arrow-red" }}
                        arrow>
                        <IconButton variant="text"
                            color="error"
                            className="reset-button"
                            onClick={onReset} >
                            <Close />
                        </IconButton>
                    </Tooltip>}
                </div>
            </div>}

            {/* List loading */}
            {!list && <ListLoading rows={5} pending={loading} />}

            {/* Select or deselect all users in class members list */}
            {isClass && list?.length > 0 &&
                /* Hidden form to reset selected users password */
                <List className='w-100'>
                    {/* Select or deselect all list */}
                    <ListItem className='result-li'>
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
                            {user.office + ((user.office !== user.department) ? " " + user.department : "")} {isClass && <span className='office-span'>{list?.filter(x => x.department === user.department)?.length} elever</span>}
                        </Typography>}

                    {/* List object */}
                    <Info
                        user={user}
                        displayName={user.displayName}
                        subTitle={user.office + " " + (user.office !== user.department ? (" " + user?.department) : "")}
                        result={true}
                        disabled={disabled}
                        handleOutsideClick={(e) => clickHandle(e, index, user)}>

                        {/* Checkbox visible only if is success result after users search by class name */}
                        {isClass && <Checkbox
                            size='small'
                            color="default"
                            ref={checkbox => refCheckbox.current[index] = checkbox}
                            checked={selectedList.indexOf(user.name) > -1}
                        />}
                    </Info>
                </div>
            ))}

            {/* Message if result is null */}
            {list?.length == 0 && <Message res={{
                color: "warning", msg: "Inget data hittades. \n\nMöjliga orsaker:" +
                    "\n• Personen/Class saknas i databasen." +
                    "\n• Sökparametrarna kan vara felstavade." +
                    "\n• Du saknar behörighet att hantera personens/classens konto."
            }} cancel={onReset} />}
        </div>
    )
}

export default ResultView;