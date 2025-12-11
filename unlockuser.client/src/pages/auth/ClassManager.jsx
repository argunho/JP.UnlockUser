
import { useEffect, useState } from 'react';

// Installed
import { ArrowDropDown, ArrowDropUp, Close } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';

// Components
import Form from '../../components/forms/Form';
import TabPanel from '../../components/blocks/TabPanel';
import MultiplePassword from '../../components/blocks/MultiplePassword';

function ClassManager() {

    const [dropdown, setDropdown] = useState(false);
    const [removed, setRemoved] = useState([]);
    const [hidden, setHidden] = useState(false);

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
        if ((removed?.length + 1) === users?.length)
            navigate(-1);

        setRemoved(previous => [...previous, id]);
    }


    // // Send email to current user with saved pdf document
    // const sendEmailWithFile = async () => {
    //     const inf = location.split("%");
    //     const data = new FormData();
    //     data.append('attachedFile', savedPdf);

    //     await fetchData({ api: `user/mail/${inf[1]} ${inf[0]}`, method: "post", data: data });
    //     handleDispatch("confirmSavePdf", false);
    //     handleDispatch("savePdf", false);
    // }

    // const handleModalOpen = () => {
    //     refModal.current?.click();
    // }

    const classMembers = users.filter(x => !removed.includes(x.name));
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
            <div className={`selected-list dropdown-container ${dropdown ? "open" : ""}`}>

                <p className="w-100 dropdown-label">
                    Klicka på användare att radera från listan
                </p>

                {/* List of students */}
                {classMembers?.map((user) => (
                    <Button
                        key={user.name}
                        variant='outlined'
                        color="inherit"
                        endIcon={<Close color="error" />}
                        onClick={() => spliceUsersList(user.name)}>
                        {user.displayName}
                    </Button>
                ))}
            </div>

            <Form
                label={"Nya lösenord till " + classMembers?.length + " elev" + (classMembers?.length === 1 ? "er" : "")}
                users={classMembers}
                hidden={hidden}
                multiple={true}
                passwordLength={8}>
                <MultiplePassword
                    label={`${school} ${classId}`}
                    subLabel={`Lösenord för ${selected?.length} elever`}
                    users={classMembers} onSwitch={(value) => setHidden(value)} />
            </Form>
        </>
    )
}

export default ClassManager;
