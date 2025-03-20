import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Installed
import { Alert, AlertTitle, Button, CircularProgress, FormControl, TextField } from '@mui/material';

// Components
import Response from '../../components/Response';

// Functions
import { ErrorHandle } from '../../functions/ErrorHandle';

// Services
import ApiRequest from '../../services/ApiRequest';

// Images
import keys from '../../assets/images/keys.png';

// Css
import '../../assets/css/login.css';

const formFields = [
    { label: "Användarnamn", name: "username", type: "text" },
    { label: "Lösenord", name: "password", type: "password" }
];

function Login({ authContext }) {
    Login.displayName = "Login";

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    const [response, setResponse] = useState();
    const [loading, setLoading] = useState(false);
    const [wait, setWait] = useState();

    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (token !== null && token !== undefined)
            navigate("/");
        document.title = "UnlockUser | Logga in";
    }, [])

    const changeHandler = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (!!response)
            setResponse();
    }

    const getTimeLeftToUnblock = (res) => {
        const num = (wait ?? res?.timeLeft)?.split(":");
        let sec = parseInt(num[2]);
        let min = parseInt(num[1]);

        setInterval(() => {
            if (sec + min === 0 || res === null) {
                clearInterval();
                hndleResponse();
            } else {
                if (sec === 0) {
                    if (min > 0) min -= 1;
                    else min = 59;
                    sec = 59;
                } else
                    sec -= 1;
            }

            setWait(`00:${(min < 10) ? "0" + min : min}:${(sec < 10) ? "0" + sec : sec}`);
        }, 1000)
    }

    const submitForm = async (e) => {
        e.preventDefault();

        setLoading(true);

        await ApiRequest("authentication", "post", formData).then(res => {
            const { token, groups, timeLeft, errorMessage } = res.data;

            if (timeLeft)
                getTimeLeftToUnblock(res.data);
            else {
                setResponse(res.data);
                if (errorMessage)
                    ErrorHandle("Error => " + errorMessage);
                else if (!!token) {
                    sessionStorage.setItem("token", token);
                    sessionStorage.setItem("groups", JSON.stringify(groups));
                    sessionStorage.setItem("group", groups[0]?.name);

                    authContext.authorize(token);
                    authContext.updateGroupName(groups[0]?.name);
                    setTimeout(() => {
                        navigate("/");
                    }, 1500)
                }
            }
            setLoading(false);
        }, error => {
            setLoading(false);
            ErrorHandle(error)
        })
    }

    const hndleResponse = useCallback(function handleResponse() {
        if (response?.alert === "success")
            navigate("/");
        else
            setResponse();
    }, []);


    return (
        <form className='login-form' onSubmit={submitForm}>
            <p className='form-title'>Logga in</p>

            {/* Response */}
            {!!response && <Response res={response} reset={hndleResponse} />}

            {/* Wait */}
            {(!!wait && !loading) && <Alert variant='filled' color="warning" className='w-100'>
                <AlertTitle>{`Vänta ${wait} minuter innan du försöker igen.`}</AlertTitle>
            </Alert>}

            {/* Form content */}
            {(!response && !wait) && <>
                {formFields?.map((x, i) => (
                    <FormControl key={i}>
                        <TextField
                            label={x.label}
                            name={x.name}
                            type={x.type}
                            value={formData[x.name]}
                            variant="outlined"
                            required
                            autoComplete='off'
                            autoSave='off'
                            inputProps={{
                                maxLength: 20,
                                minLength: 5
                            }}
                            disabled={loading}
                            onChange={changeHandler} />
                    </FormControl>
                ))}

                <Button variant="outlined"
                    className='button-btn'
                    color="inherit"
                    type="submit"
                    title="Logga in"
                    disabled={loading || formData?.username.length < 5 || formData?.password.length < 5} >
                    {loading ? <CircularProgress style={{ width: "12px", height: "12px", marginTop: "3px" }} /> : "Skicka"}</Button>
            </>}


            {/* Login logo */}
            <img src={keys} alt="UnlockUser" className='login-form-img' />
        </form>
    )
}

export default Login;