import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

// Installed
import { Button, CircularProgress, FormControl, TextField } from '@mui/material';

// Components
import Response from './../components/Response';

// Services
import ApiRequest from '../services/ApiRequest';

// Images
import keys from './../assets/images/keys.png';

// Css
import './../assets/css/login.css';

const formFields = [
    { label: "Användarnamn", name: "username", type: "text" },
    { label: "Lösenord", name: "password", type: "password" }
];

function Login({updateGroup}) {
    Login.displayName = "Login";

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    const [response, setResponse] = useState();
    const [loading, setLoading] = useState(false);

    const history = useHistory();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (token !== null && token !== undefined)
            history.push("/find-user");
        document.title = "UnlockUser | Logga in";
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                updateGroup(groups.split(",")[0]);
                sessionStorage.setItem("token", token);
                sessionStorage.setItem("groups", groups);
                setTimeout(() => {
                   history.push("/find-user");
                }, 2000)
            } else if (errorMessage)
                console.error("Error response => " + errorMessage);
        }, error => {
            setLoading(false);
            console.error("Error => " + error);
        })
    }

    const resetResponse = () => {
        if (response?.alert === "success")
            history.push("/find-user");
        else
            setResponse();
    };


    return (
        <form className='login-form' onSubmit={submitForm}>
            <p className='form-title'>Logga in</p>
            {!!response && <Response response={response} reset={resetResponse} />}
            {!response && formFields.map((x, i) => (
                <FormControl key={i}>
                    <TextField
                        label={x.label}
                        name={x.name}
                        type={x.type}
                        value={formData[x.name]}
                        variant="outlined"
                        required
                        inputProps={{
                            maxLength: 20,
                            minLength: 5,
                            autoComplete: formData[x.name],
                            form: { autoComplete: 'off', }
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
                disabled={loading || formData.username.length < 5 || formData.password.length < 5} >
                {loading ? <CircularProgress style={{ width: "12px", height: "12px", marginTop: "3px" }} /> : "Skicka"}</Button>}
            <img src={keys} alt="UnlockUser" className='login-form-img' />
        </form>
    )
}

export default Login;