
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

function UserManager({ authContext, navigate }) {
    UserManager.displayName = "UserManager";

    const { id } = useParams();

    const [user, setUser] = useState(null);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noAccess, setNoAccess] = useState(false);

    useEffect(() => {
        if (!!id)
            getUserData();

        document.title = "UnlockUser | Användare";
    }, [id])

    async function getUserData() {
        await ApiRequest(`user/${authContext.group}/${id}`).then(res => {
            const { user, msg } = res.data;
            if (user !== undefined && user !== null) {
                user.subTitle = user?.office + (user?.office !== user?.department ? (" " + user?.department) : "")
                setUser(user);
            } else if (!!msg)
                setResponse(res?.data);
            setLoading(false);
        }, error => {
            if (error?.response?.status === 401) {
                setNoAccess(true);

                setTimeout(() => {
                    navigate("/");
                }, 3000)
            } else
                console.error("Error => " + error.response)

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
        }, error => {
            // Error handle
            setLoading(false);
            if (error?.response.status === 401)
                setNoAccess(true);
            else
                console.error("Error => " + error.response);
        })
    }

    return <div className='interior-div'>
        {/* Info about user */}
        <Info
            check={true}
            user={user}
            displayName={user?.displayName ?? "Anvädarprofil"}
            subTitle={user?.subTitle ?? ""}
        />

        {/* Response */}
        {response && <Response response={response} noAccess={noAccess} reset={() => setResponse(null)} />}

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