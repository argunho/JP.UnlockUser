import { useEffect, useState } from 'react';

// Installed
import { useOutletContext, useNavigate } from 'react-router-dom';
import {  Button, IconButton } from '@mui/material';
import { ChevronRight, Policy } from '@mui/icons-material';

// Components

// Functions
import { Claim } from './../../functions/DecodedToken';
import TabPanel from '../../components/blocks/TabPanel';

// Storage


function Overview() {

    const [control, setControl] = useState(false);

    const { id, collections } = useOutletContext();

    const groups = Claim("groups").split(",");
    const permissions = JSON.parse(Claim("permissions"));
    
    console.log(permissions)

    const user = groups.flatMap(g => collections[g.toLowerCase()]).find(x => x.name === id);
    const access = permissions.find(x => x.name === user.group) != null;

    const navigate = useNavigate();

    useEffect(() => {
        if(Claim["access"])
            navigate(-1);
    }, [])


    return <>
        {/* Tab menu */}
        <TabPanel primary={user.primary ?? "Anvädarprofil"} secondary={
            `<span class="secondary-span view">${user?.title ? user?.title : (user?.passwordLength > 8 ? "Anställd" : "Student")}</span>`
        }>
            {/* If account is blocked */}
            <div className="d-row">
                {user?.isLocked && <span className="unlock-span locked-account">Kontot är låst</span>}

                {access && <Button
                    onClick={() => navigate(`/manage/${user.group}/user/${user?.name}`)}
                    className="unlock-btn button-btn">
                    {user?.isLocked ? "Låsa upp kontot" : "Ändra lösenord"}
                </Button>}

                <IconButton onClick={() => setControl((control) => !control)}>
                    <Policy />
                </IconButton>
            </div>
        </TabPanel>
        <div className="d-row wrap">
            <section className="d-column">
I am section
            </section>

            {control && <section>
                Hello, I am here
            </section>}
        </div>
    </>
}

export default Overview;
