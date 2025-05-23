
import { useEffect, useState } from 'react';

// Installed
import { ArrowDropDown, ArrowDropUp, Close } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import Form from '../../components/Form';
import Info from '../../components/Info';



function UsersManager() {

    const { cls, school } = useParams();

    const [name, setName] = useState("");
    const [users, setUsers] = useState([]);
    const [schoolName, setSchoolName] = useState("");
    const [dropdown, setDropdown] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        setName("Klass " + cls);
        setSchoolName(school);
        if (!!sessionStorage.getItem("selectedUsers"))
            setUsers(JSON.parse(sessionStorage.getItem("selectedUsers")));

        document.title = "UnlockUser | Användare";
    }, [])

    function spliceUsersList(user) {
        if (users.length === 1)
            navigate(-1);
        setUsers(users.filter(x => x !== user));
    }

    return (
        <div className='interior-div w-100' id="interior_div">
            <Info
                name={name}
                displayName={schoolName}
                subTitle={`${users.length} elev${users.length === 1 ? "" : "er"}`}
            />

            {/* Edit class members list */}
            <Button variant='text' onClick={() => setDropdown((dropdown) => !dropdown)} color={dropdown ? "primary" : "inherit"}>
                Klassmedlemmar &nbsp;&nbsp;{dropdown ? <ArrowDropUp /> : <ArrowDropDown />}
            </Button>

            <div className={`selected-list dropdown-div ${dropdown ? "dropdown-open" : ""}`}>
                <p className='tips-p'>Klicka på användare att radera från listan</p>
                {users?.map((user, index) => (
                    <Button variant='outlined' color='inherit' className='button-list' key={index} onClick={() => spliceUsersList(user)}>
                        {user.name} <Close fontSize='10' />
                    </Button>
                ))}
            </div>

            <Form title={"Nya lösenord till " + users?.length + " elev" + (users?.length === 1 ? "er" : "")}
                users={users}
                passwordLength={8} />
        </div>
    )
}

export default UsersManager;
