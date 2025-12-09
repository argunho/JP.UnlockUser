
import { useEffect, useState } from 'react';

// Installed
import { ArrowDropDown, ArrowDropUp, Close } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';

// Components
import Form from '../../components/forms/Form';
import TabPanel from '../../components/blocks/TabPanel';


function ClassManager() {

    const [dropdown, setDropdown] = useState(false);
    const [removed, setRemoved] = useState([]);

    const { collections, classId, school } = useOutletContext();

    const navigate = useNavigate();
 
    const loc = useLocation();
    const { selected } = loc.state;


    const users = collections.studenter?.map((user) => {
        if (selected.includes(user?.name))
            return user;
        return null;
    })?.filter(Boolean) ?? [];

    useEffect(() => {
        document.title = `UnlockUser | ${school} ${classId}`;
    }, [])

    function spliceUsersList(id) {
        if((removed?.length + 1) === users?.length)
            navigate(-1);

        setRemoved(previous => [...previous, id]);
    }

    return (
        <>
            {/* Tab menu */}
            <TabPanel primary={`${school} ${classId}`} secondary={`${selected?.length} student(er)`}>
                {/* Edit class members list */}
                <Button 
                    color={dropdown ? "primary" : "inherit"}
                    endIcon={dropdown ? <ArrowDropUp /> : <ArrowDropDown />}
                    onClick={() => setDropdown((dropdown) => !dropdown)}>
                    Klassmedlemmar
                </Button>
            </TabPanel>

            {/* Student to manage  */}
            <div className={`selected-list dropdown-div ${dropdown ? "dropdown-open" : ""}`}>

                <p className="w-100 dropdown-label">
                    Klicka på användare att radera från listan
                </p>

                {/* List of students */}
                {users.filter(x => !removed.includes(x.name))?.map((user) => (
                    <Button 
                        key={user.name} 
                        variant='outlined' 
                        color="inherit"
                        endIcon={<Close color="error" />}
                        onClick={() => spliceUsersList(user)}>
                        {user.displayName} 
                    </Button>
                ))}
            </div>

            <Form 
                title={"Nya lösenord till " + users?.length + " elev" + (users?.length === 1 ? "er" : "")}
                users={users}
                passwordLength={8} />
        </>
    )
}

export default ClassManager;
