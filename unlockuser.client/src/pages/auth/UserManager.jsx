
import { use, useEffect } from 'react';

// Installed
import { Button, CircularProgress } from '@mui/material';
import { useOutletContext, useLoaderData, useNavigate } from 'react-router-dom';

// Components
import Form from '../../components/forms/Form';
import TabPanel from '../../components/blocks/TabPanel';

// Storage
import { FetchContext } from '../../storage/FetchContext';


function UserManager() {

    const { collections, group, id } = useOutletContext();

    const { pending, fetchData } = use(FetchContext)
    const navigate = useNavigate();

    const loaderData = useLoaderData();

    const user = collections[group] ? collections[group]?.find(x => x?.name === id) : loaderData;

    useEffect(() => {
        if (!user) {
            navigate(`/manage/${group}/user/${id}/load`, { replace: true });
        }
    }, [user]);

    // Unlock user
    async function unlockUser() {
        // Request
        await fetchData({ api: "api/user/unlock/" + user?.name, method: "patch" });
    }

    return <>
        {/* Tab menu */}
        <TabPanel primary={user.primary ?? "Anvädarprofil"} secondary={user.secondary}>
            {/* If account is blocked */}
            {user.isLocked && <div className="d-row">
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
            label="Återställa lösenord"
            users={[user]}
            locked={user?.isLocked}
            passwordLength={user?.passwordLength} />}
    </>

}

export default UserManager;