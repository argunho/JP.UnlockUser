
import { useEffect, useState, useCallback, use } from 'react';
import { useParams } from 'react-router-dom';

// Installed
import { Lock, LockOpen } from '@mui/icons-material';
import { Button, CircularProgress } from '@mui/material';

// Components
import Form from '../../components/Form';
import Info from '../../components/Info';
import Response from '../../components/Response';
import Loading from '../../components/Loading';

// Functions
import { ErrorHandle } from '../../functions/ErrorHandle';

// Services
import ApiRequest from '../../services/ApiRequest';

// Stroage
import { AuthContext } from '../../storage/AuthContext';

// Css
import '../../assets/css/userview.css';

// Images
import loadingImg from "../../assets/images/loading.gif";

function UserManager() {

    const { id } = useParams();

    const [user, setUser] = useState(null);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(true);
    const { group } = use(AuthContext);

    useEffect(() => {
        document.title = "UnlockUser | Användare";

        async function getUserData() {
            await ApiRequest(`user/${group}/${id}`).then(res => {
                const { user, msg } = res?.data;
                if (user !== undefined && user !== null) {
                    user.subTitle = user?.office + (user?.office !== user?.department ? (" " + user?.department) : "")
                    setUser(user);
                } else if (!!msg)
                    setResponse(res?.data);
                setLoading(false);
            }, error => {
                ErrorHandle(error);
                setLoading(false);
            })
        }

        if (!!id)
            getUserData();
    }, [id])



    // Unlock user
    async function unlockUser() {
        setLoading(true);
        setResponse(null);

        // Request
        await ApiRequest("user/unlock/" + user?.name).then(res => {
            setLoading(false);
            setResponse(res?.data);
            // getUserData();
        }, error => { // Error handle
            ErrorHandle(error);
            setLoading(false);
        })
    }

    const handleResponse = useCallback(function handleResponse() {
        setResponse(null);
    }, [])

    return <div className='interior-div w-100'>
        {/* Info about user */}
        <Info user={user}
            displayName={user?.displayName ?? "Anvädarprofil"}
            subTitle={user?.subTitle ?? ""}
        />

        {/* Response */}
        {response && <Response res={response} cancel={handleResponse} />}

        {/* Unlock user */}
        {!!user && <>
            <div className={'unlock-block w-100 d-row jc-between' + (user?.isLocked ? " locked-account" : "")}>
                <div className="d-row">
                    {user?.isLocked ? <Lock /> : <LockOpen />}
                    <span>{user?.isLocked ? "Kontot är låst" : "Aktiv konto"}</span>
                </div>


                {/* Unlock user - button */}
                <Button variant="contained"
                    color="error"
                    disabled={!user?.isLocked || loading}
                    onClick={unlockUser}
                    className="unlock-btn button-btn">
                    {loading ? <CircularProgress style={{ width: "15px", height: "15px", marginTop: "3px" }} /> : "Lås upp"}
                </Button>
            </div>

            {/* Change password */}
            {(user && !user?.isLocked) && <Form
                title="Återställa lösenord"
                users={[user]}
                passwordLength={user?.passwordLength} />}
        </>}

        {/* Visible image under search progress */}
        {loading && <Loading msg="söker efter användardata." img={loadingImg} />}
    </div>

}

export default UserManager;