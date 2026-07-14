
import { useEffect, useState } from 'react';

// Installed
import { ArrowDropDown, ArrowDropUp, Close } from '@mui/icons-material';
import { Button, ClickAwayListener } from '@mui/material';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';

// Components
import Form from '../../components/forms/Form';
import TabPanel from '../../components/blocks/TabPanel';
import MultiplePassword from '../../components/blocks/MultiplePassword';

function ClassManager() {

    const [dropdown, setDropdown] = useState(false);
    const [removed, setRemoved] = useState([]);
    const [hidden, setHidden] = useState(false);

    const { classId, school } = useOutletContext();

    const navigate = useNavigate();

    const loc = useLocation();
    const { selected, list } = loc.state ?? {};

    const users = list?.map((user) => {
        if (selected?.includes(user?.username))
            return user;
        return null;
    })?.filter(Boolean) ?? [];

    useEffect(() => {
        document.title = `UnlockUser | ${school} ${classId}`;
    }, [])

    useEffect(() => {
        if (!loc.state) navigate(-1);
    }, [])

    function spliceUsersList(id) {
        if ((removed?.length + 1) === users?.length)
            navigate(-1);

        setRemoved(previous => [...previous, id]);
    }

    const classMembers = users.filter(x => !removed.includes(x.username));
    const lgh = classMembers?.length;
    const slgh = selected?.length - removed?.length;

    return (
        <>
            {/* Tab menu */}
            <TabPanel primary={`${school} ${classId}`} secondary={`${slgh} student${slgh > 1 ? "(er)" : ""}`}>
                {/* Edit class members list */}
                <Button
                    color={dropdown ? "primary" : "inherit"}
                    endIcon={dropdown ? <ArrowDropUp /> : <ArrowDropDown />}
                    onClick={() => setDropdown((dropdown) => !dropdown)}>
                    Klassmedlemmar
                </Button>
            </TabPanel>

            {/* Student to manage  */}
            <ClickAwayListener
                mouseEvent="onMouseDown"
                touchEvent="onTouchStart"
                onClickAway={() => setDropdown(false)}>
                <div className={`selected-list dropdown-container${dropdown ? " open" : ""}`}>

                    <p className="w-100 dropdown-label">
                        Klicka på användare för att radera användaren från listan
                    </p>

                    {/* List of students */}
                    {classMembers?.map((user) => (
                        <Button
                            key={user.username}
                            variant='outlined'
                            color="inherit"
                            endIcon={<Close color="error" />}
                            onClick={() => spliceUsersList(user.username)}>
                            {user.displayName}
                        </Button>
                    ))}
                </div>
            </ClickAwayListener>

            <Form
                label={`Nya lösenord till ${lgh} elev${(lgh > 1 ? "er" : "")}.`}
                labelInFile={`${school} ${classId}`}
                users={classMembers}
                hidden={hidden}
                multiple={true}
                passwordLength={8}>
                <MultiplePassword
                    label={`${school} ${classId}`}
                    subLabel={`Lösenord för ${selected?.length} elever`}
                    users={classMembers}
                    onSwitch={(value) => setHidden(value)} />
            </Form>
        </>
    )
}

export default ClassManager;
