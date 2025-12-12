import { use, useReducer, useActionState, Children, cloneElement } from 'react';

// Installed
import {
    Checkbox, FormControl, FormControlLabel, TextField, IconButton
} from '@mui/material';
import { Abc, Password } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Components
import ModalView from '../modals/ModalView';
import FormButtons from './FormButtons';
import Message from './../blocks/Message';
import PasswordGeneration from '../blocks/PasswordGeneration';
import { PasswordTips } from '../../models/HelpTexts';

// Functions
import { DecodedToken } from '../../functions/DecodedToken';
import { PDFConverter } from '../../functions/PDFConverter';
import { DownloadFile } from '../../functions/Functions';

// Storage
import { AuthContext } from '../../storage/AuthContext';
import { FetchContext } from '../../storage/FetchContext';

// Form inputs
const fields = [
    { name: "password", label: "Lösenord", placeholder: "" },
    { name: "confirmPassword", label: "Bekräfta lösenord", placeholder: "" }
]

const initialState = {
    showPassword: false,
    password: null,
    isCleaned: null,
    isChanged: false
};

// Action reducer
function actionReducer(state, action) {
    const payload = action.payload ? action.payload : null;
    switch (action.type) {
        case "PARAM":
            return {
                ...state, [action.name]: payload
            };
        case "PASSWORD":
            return {
                ...state, isChanged: true, showPassword: true, password: payload
            };
        case "RESET_FORM_TOTAL":
            return {
                ...state, showPassword: false, isGenerated: false, formData: null, isCleaned: new Date().getMilliseconds()
            };
        default:
            return state;
    }
}

function Form({ children, label, labelFile, passwordLength, locked, users, multiple, hidden }) {


    const { group } = use(AuthContext);

    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { showPassword, password, isCleaned, isChanged } = state;

    const { response, pending: load, fetchData, handleResponse } = use(FetchContext);

    const decodedToken = DecodedToken();
    const developer = decodedToken?.Roles?.indexOf("Developer") > -1;

    const navigate = useNavigate();

    // Regex to validate password 
    const regex = passwordLength === 12
        ? /^(?=.*[0-9])(?=.*[!@?$&#^%*-,;._])[A-Za-z0-9!@?$&#^%*-,;._]{12,50}$/
        : /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9]{8,50}$/;

    function handleDispatch(name, value) {
        dispatch({ type: "PARAM", name: name, payload: value });
    }

    // Reset form
    function onReset() {
        dispatch({ type: "RESET_FORM_TOTAL" });
    }

    function onChange(value) {
        dispatch({ type: "PASSWORD", payload: value });
    }

    // Submit form => This is used when a password is being set for a user.
    async function onSubmit(previous, fd) {
        const { data, error } = comparePasswords(fd);

        if (error)
            return { data, error };

        data.username = users[0].name;
        data.group = group;
        console.log(data)

        // Request
        await fetchData({ api: "user/reset/passwords", method: "post", data: data });

        onReset();
        return null;
    }

    // Submit form => This is used when a password is being set for a school class.
    async function onSubmitMultiple(previous, fd) {
        let data = {};
        let error = null;

        // If form inputs not used for password
        if (!hidden) {
            const res = comparePasswords(fd);
            data = res.data;
            error = res.error;
        }

        delete data.password;

        const usersToManage = fd.get("users");

        if (!usersToManage || JSON.parse(usersToManage)?.length === 0)
            error = "Listan med användare för att sätta lösenord är tom.";

        if (error)
            return { data, error };

        data.users = JSON.parse(usersToManage);

        // Request
        let formData = data;
        let actions = fd.get("actions") ? JSON.parse(fd.get("actions")) : null;
        let api = "user/reset/passwords";
        if (actions) {
            const blobFile = PDFConverter(label, labelFile);
            if (actions.includes("email")) {
                api = "user/reset/save/passwords";
                const file = new File([blobFile], `${label} ${labelFile}.pdf`, { type: "application/pdf" });
                formData = new FormData();
                formData.append("file", file)
                formData.append("data", JSON.stringify(data));
                formData.append("label", labelFile);
            }

            const res = await fetchData({ api: api, method: "post", data: formData, action: "success" });

            if (res && actions.includes("download"))
                DownloadFile(blobFile, `${label} ${labelFile}.pdf`);
        } else
            await fetchData({ api: api, method: "post", data: formData });

        onReset();
        return null;
    }

    function comparePasswords(fd) {
        const _password = fd.get("password")?.trim() ?? password;
        const _confirmPassword = fd.get("confirmPassword")?.trim() ?? password;

        let data = {
            password: _password,
            check: false
        };

        if (fd.get("check") === "on")
            data.check = true;

        let error = null;
        if (_password.length < passwordLength)
            error = `Lösenords längd måste bli minst ${passwordLength} tecken`;
        else if (_password !== _confirmPassword)
            error = "Lösenorden matchar inte. Kontrollera och försök igen.";
        else if (!regex.test(password))
            error = "Lösenordet följer inte det angivna formatet. Var god kontrollera kraven.";

        return { data, error };
    }

    const [formState, formAction, pending] = useActionState(multiple ? onSubmitMultiple : onSubmit, { error: null });
    const error = formState?.error;
    const disabled = load || response || pending || locked;


    const modifiedChildren = children ? Children.map(children, child =>
        cloneElement(child, {
            pending: load || pending,
            disabled: response
        })
    ) : null;

    return (
        <>
            <div className='form-wrapper w-100'>

                <div className="d-row jc-between">

                    {/* Title */}
                    <h2 className='label'>
                        {label}

                        {/* Modal  window with help texts */}
                        <ModalView
                            label="Lösenordskrav"
                            content={PasswordTips(passwordLength)} />
                    </h2>

                    {/* Generate password */}
                    {!multiple && <PasswordGeneration
                        key={isCleaned}
                        passwordLength={passwordLength}
                        disabled={disabled}
                        setGenerated={val => handleDispatch("isGenerated", val)}
                        regex={regex}
                        onChange={onChange} />}

                </div>

                {/* Response message */}
                {response && <Message res={response} cancel={() => response.success ? navigate("/") : handleResponse()} />}
                {/* Error message */}
                {error && <Message res={{ color: "error", msg: error }} />}

                {/* Password form */}
                {!response && <form key={isCleaned} className='user-view-form fade-in' action={formAction}>

                    {modifiedChildren}

                    {/* Passwords inputs */}
                    {!hidden && fields?.map((field, i) => {

                        const value = formState?.[field.name] ?? password ?? "";
                        console.log(value)
                        return <FormControl key={i} fullWidth>
                            <TextField
                                key={value}
                                label={field.label}
                                name={field.name}
                                type={showPassword ? "text" : "password"}
                                variant="outlined"
                                required
                                defaultValue={value}
                                inputProps={{
                                    minLength: passwordLength,
                                    autoComplete: fields[field.name],
                                    form: { autoComplete: 'off', }
                                }}
                                InputProps={field.name === "password" ? {
                                    endAdornment: (
                                        <IconButton
                                            disabled={disabled}
                                            onClick={() => handleDispatch("showPassword", !showPassword)}
                                            title="Visa lösenord">
                                            {showPassword ? <Abc /> : <Password />}
                                        </IconButton>
                                    )
                                } : undefined
                                }
                                className={`field ${(error ? "error" : '')}`}
                                error={error}
                                placeholder={field?.placeholder}
                                disabled={disabled}
                            />
                        </FormControl>
                    })}


                    {/* Buttons */}
                    {(!hidden && !locked) && <FormButtons
                        label="Verkställ"
                        disabled={!isChanged}
                        confirmable={true}
                        loading={load || pending}
                        onCancel={onReset}
                    >

                        {/* Change the password input type */}
                        {developer && <FormControlLabel
                            className='checkbox'
                            title="Spara inte logfilen"
                            control={<Checkbox
                                name="check"
                                disabled={disabled} />}
                            label="Test" />}
                    </FormButtons>}
                </form>}
            </div>
        </>

    )
}

export default Form;