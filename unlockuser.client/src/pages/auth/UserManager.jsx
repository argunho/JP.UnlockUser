
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
    UserManager.displayName = "UserManage";

    const { id } = useParams();

    const [user, setUser] = useState({
        name: "Anvädarprofil",
        displayName: null,
        email: null,
        office: null,
        department: null,
        isLocked: false,
        passwordLength: 0
    });
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noAccess, setNoAccess] = useState(false);
    const [wasFound, setWasFound] = useState(false);

    useEffect(() => {
        if (!!id)
            getUser();

        document.title = "UnlockUser | Användare";
    }, [])


    async function getUser() {
        console.log("user/" + authContext.group.toLowerCase() + "/" + id)
        await ApiRequest("user/" + authContext.group + "/" + id).then(res => {
            const { user, passwordLength, msg } = res.data;
console.log(user)
            if (user !== undefined && user !== null) {
                setUser({
                    ...user,
                    name: user?.name,
                    displayName: user.displayName,
                    email: user.email,
                    office: user?.office,
                    department: user?.department,
                    isLocked: user.isLocked,
                    passwordLength: passwordLength,
                    subTitle: user?.office + (user.office !== user.department ? (" " + user?.department) : "")
                });
                setWasFound(true);
            } else if(!!msg)
                setResponse(res?.data);
        }, error => {
            if (error?.response?.status === 401) {
                setNoAccess(true);

                setTimeout(() => {
                    navigate("/");
                }, 3000)
            } else
                console.error("Error => " + error.response)
        })
    }

    // Unlock user
    async function unlockUser() {
        setLoading(true);
        setResponse(null);

        // Request
        await ApiRequest("user/unlock/" + user.name).then(res => {
            setLoading(false);
            setResponse(res?.data);
            getUser();
        }, error => {
            // Handle of error
            setLoading(false);
            if (error?.response.status === 401)
                setNoAccess(true);
            else
                console.error("Error => " + error.response);
        })
    }

    if (response)
        return <Response response={null} noAccess={noAccess} />;

    return <div className='interior-div'>
        {/* Info about user */}
        <Info
            check={true}
            user={user}
            displayName={user?.displayName}
            subTitle={user?.subTitle}
        />

        {/* Response */}
        {response && <Response response={response} reset={() => setResponse(null)} />}

        {/* Unlock user */}
        {wasFound && <>
            <div className={'unlock-block' + (user.isLocked ? " locked-account" : "")}>
                {user.isLocked ? <Lock /> : <LockOpen />}
                <span>{user.isLocked ? "Kontot är låst" : "Aktiv konto"}</span>

                {/* Unlock user - button */}
                <Button variant="contained"
                    color="error"
                    disabled={!user.isLocked || loading}
                    onClick={unlockUser}
                    className="unlock-btn button-btn">
                    {loading ? <CircularProgress style={{ width: "15px", height: "15px", marginTop: "3px" }} /> : "Lås upp"}
                </Button>
            </div>

            {/* Change password */}
            {(user && !user.isLocked) && <Form
                title="Återställa lösenord"
                users={[user]}
                passwordLength={user.passwordLength} />}
        </>}

        {/* Visible image under search progress */}
        {!wasFound && <Loading msg="söker efter användardata." img={loadingImg} />}
    </div>

}

export default UserManager;