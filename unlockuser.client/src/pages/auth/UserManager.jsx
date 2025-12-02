
import { use, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// Installed
import { Lock, LockOpen } from '@mui/icons-material';
import { Button, CircularProgress } from '@mui/material';
import { useOutletContext, useLoaderData } from 'react-router-dom';

// Components
import Form from '../../components/forms/Form';
import Info from '../../components/blocks/Info';
import Message from '../../components/blocks/Message';
import Loading from '../../components/Loading';


// Storage
import { FetchContext } from '../../storage/FetchContext';

// Css
import '../../assets/css/user-view.css';


function UserManager() {

    const { group, id } = useParams();
    const { dashboardData, loading } = useOutletContext();
    const { collections } = dashboardData;

    const { response, fetchData } = use(FetchContext)

    const user = collections[group] ? collections[group]?.find(x => x?.name === id) : useLoaderData();
    if (user !== null)
        user.subTitle = user?.office + (user?.office !== user?.department ? (" " + user?.department) : "");




    // Unlock user
    async function unlockUser() {


        // Request
        await ApiRequest("api/user/unlock/" + user?.name).then(res => {

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
        {response && <Message res={response} cancel={handleResponse} />}

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