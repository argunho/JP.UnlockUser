
import { use, useEffect } from 'react';

// Installed
import { Button, CircularProgress } from '@mui/material';
import { useOutletContext, useLoaderData, useNavigate } from 'react-router-dom';

// Components
import Form from '../../components/forms/Form';
import Message from '../../components/blocks/Message';
import TabPanel from '../../components/blocks/TabPanel';


// Storage
import { FetchContext } from '../../storage/FetchContext';

// Css
import '../../assets/css/user-view.css';


function UserManager() {

    const { dashboardData, loading, group, id  } = useOutletContext();
    const { collections } = dashboardData;

    const { pending, response, fetchData, handleResponse } = use(FetchContext)
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

        {/* Response */}
        {response && <Message res={response} cancel={() => handleResponse()} />}

        {/* Change password */}
        {(user && !user?.isLocked) && <Form
                title="Återställa lösenord"
                users={[user]}
                passwordLength={user?.passwordLength} />}
    </>

}

export default UserManager;