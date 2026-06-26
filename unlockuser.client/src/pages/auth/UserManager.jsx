
import { use, useState } from 'react';

// Installed
import { Button, CircularProgress } from '@mui/material';
import { useParams, useLoaderData } from 'react-router-dom';

// Components
import Form from '../../components/forms/Form';
import TabPanel from '../../components/blocks/TabPanel';

// Storage
import { FetchContext } from '../../storage/FetchContext';


function UserManager() {

    const { group, id } = useParams();
    console.log(group, id)

    const { pending, fetchData } = use(FetchContext)
    const user = useLoaderData();
    const [locked, setLocked] = useState(user?.isLocked);

    // Unlock user
    async function unlockUser() {
        // Request
        const res = await fetchData({ api: "api/user/unlock/" + user?.name, method: "put", action: "success" });
        setLocked(res ? true : false);
    }

    console.log(group, user)

    return <>
        {/* Tab menu */}
        <TabPanel primary={user?.primary ?? "Anvädarprofil"} secondary={user?.secondary}>
            {/* If account is blocked */}
            {locked && <div className="d-row">
                <span className="unlock-span locked-account">Kontot är låst</span>
                <Button variant="contained"
                    color="error"
                    disabled={pending}
                    onClick={unlockUser}
                    className="unlock-btn button-btn">
                    {pending ? <CircularProgress style={{ width: "15px", height: "15px", marginTop: "3px" }} /> : "Lås upp"}
                </Button>
            </div>}
        </TabPanel>

        {/* Change password */}
        {(user && !user?.isLocked) && <Form
            key={locked?.toString()}
            label="Återställa lösenord"
            users={[user]}
            locked={locked}
            passwordLength={user?.passwordLength} />}
    </>

}

export default UserManager;