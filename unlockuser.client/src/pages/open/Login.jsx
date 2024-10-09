import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Installed
import { Button, CircularProgress, FormControl, TextField } from '@mui/material';

// Components
import Response from '../../components/Response';

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

    const submitForm = async (e) => {
        e.preventDefault();

        setLoading(true);

        await ApiRequest("auth", "post", formData).then(res => {
            const { alert, token, groups, errorMessage } = res.data;

            let success = alert === "success";
            setResponse(res.data);
            setLoading(false);

            if (success) {
                sessionStorage.setItem("token", token);
                sessionStorage.setItem("groups", JSON.stringify(groups));
                sessionStorage.setItem("group", groups[0]?.name);
                if (token)
                    authContext.authorize(token);
                authContext.updateGroupName(groups[0]?.name);
                setTimeout(() => {
                    navigate("/");
                }, 1500)
            } else if (errorMessage)
                console.error("Error response => " + errorMessage);
        }, error => {
            setLoading(false);
            console.error("Error => " + error);
        })
    }

    const resetResponse = () => {
        if (response?.alert === "success")
            navigate("/");
        else
            setResponse();
    };


    return (
        <form className='login-form' onSubmit={submitForm}>
            <p className='form-title'>Logga in</p>
            {!!response && <Response response={response} reset={resetResponse} />}
            {!response && formFields?.map((x, i) => (
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

            {!response && <Button variant="outlined"
                className='button-btn'
                color="inherit"
                type="submit"
                title="Logga in"
                disabled={loading || formData?.username.length < 5 || formData?.password.length < 5} >
                {loading ? <CircularProgress style={{ width: "12px", height: "12px", marginTop: "3px" }} /> : "Skicka"}</Button>}
            <img src={keys} alt="UnlockUser" className='login-form-img' />
        </form>
    )
}

export default Login;