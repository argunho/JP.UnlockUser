
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// Installed
import { Lock, LockOpen } from '@mui/icons-material';
import { Button, CircularProgress } from '@mui/material';

// Components
import Form from '../../components/Form';
import Info from '../../components/Info';
import Response from '../../components/Response';
import Loading from '../../components/Loading';

// Services
import ApiRequest from '../../services/ApiRequest';

// Css
import '../../assets/css/userview.css';

// Images
import loadingImg from "../../assets/images/loading.gif";
import { ErrorHandle } from '../../functions/ErrorHandle';

function UserManager({ authContext, navigate }) {
    UserManager.displayName = "UserManager";

    const { id } = useParams();

    const [user, setUser] = useState(null);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!!id)
            getUserData();

        document.title = "UnlockUser | Användare";
    }, [id])

    async function getUserData() {
        await ApiRequest(`user/${authContext.group}/${id}`).then(res => {
            const { user, msg } = res?.data;
            if (user !== undefined && user !== null) {
                user.subTitle = user?.office + (user?.office !== user?.department ? (" " + user?.department) : "")
                setUser(user);
            } else if (!!msg)
                setResponse(res?.data);
            setLoading(false);
        }, error => {
            ErrorHandle(error, navigate);
            setLoading(false);
        })
    }

    // Unlock user
    async function unlockUser() {
        setLoading(true);
        setResponse(null);

        // Request
        await ApiRequest("user/unlock/" + user?.name).then(res => {
            setLoading(false);
            setResponse(res?.data);
            getUserData();
        }, error => { // Error handle
            ErrorHandle(error, navigate);
            setLoading(false);
        })
    }

    return <div className='interior-div w-100'>
        {/* Info about user */}
        <Info
            check={true}
            user={user}
            displayName={user?.displayName ?? "Anvädarprofil"}
            subTitle={user?.subTitle ?? ""}
        />

        {/* Response */}
        {response && <Response res={response} reset={() => setResponse(null)} />}

        {/* Unlock user */}
        {!!user && <>
            <div className={'unlock-block' + (user?.isLocked ? " locked-account" : "")}>
                {user?.isLocked ? <Lock /> : <LockOpen />}
                <span>{user?.isLocked ? "Kontot är låst" : "Aktiv konto"}</span>

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