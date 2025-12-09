import { use, useReducer, useActionState } from 'react';

// Installed
import {
    Checkbox, FormControl, FormControlLabel, TextField, IconButton
} from '@mui/material';
import { Abc, Password } from '@mui/icons-material';

// Components
import ModalView from '../modals/ModalView';
import Message from '../blocks/Message';
import FormButtons from './FormButtons';
import PasswordGeneration from '../blocks/PasswordGeneration';

// Functions
import { DecodedToken } from '../../functions/DecodedToken';

// Storage
import { AuthContext } from '../../storage/AuthContext';
import { FetchContext } from '../../storage/FetchContext';
import { PasswordTips } from '../../models/HelpTexts';


// Form inputs
const fields = [
    { name: "password", label: "Lösenord", placeholder: "" },
    { name: "confirmPassword", label: "Bekräfta lösenord", placeholder: "" }
]

const initialState = {
    showPassword: false,
    formData: null,
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
        case "RESET_FORM_TOTAL":
            return {
                ...state, showPassword: false, isGenerated: false, formData: null, isCleaned: new Date().getMilliseconds()
            };
        default:
            return state;
    }
}

function Form({ children, label, passwordLength, users, multiple, visible: isVisible }) {

    const { group } = use(AuthContext);

    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { showPassword, formData, isCleaned, isChanged } = state;

    const { response, pending: load, fetchData, handleResponse } = use(FetchContext);


    const decodedToken = DecodedToken();
    const developer = decodedToken?.Roles?.indexOf("Developer") > -1;

    function handleDispatch(name, value) {
        dispatch({ type: "PARAM", name: name, payload: value });
    }

    // Reset form
    function onReset() {
        dispatch({ type: "RESET_FORM_TOTAL" });
    }

    function onChange(data) {
        handleDispatch("formData", data);
        handleDispatch("showPassword", true);
    }

    // Function - submit form
    async function onSubmit(previous, fd) {
        let data = {
            password: fd.get("password"),
            confirmPassword: fd.get("confirmPassword"),
            users: [],
            check: false
        };

        if (fd.get("check") === "on")
            data.check = true;

        let errors = [];

        if (data.password?.length < passwordLength)
            errors.push("password");
        if (data.password !== data.confirmPassword)
            errors.push("confirmPassword");

        data.users = formData?.users?.map((user) => {
            return {
                username: user.name,
                password: data.password,
                groupName: group
            };
        });

        if (errors?.length > 0) {
            return {
                data: data,
                errors: errors
            }
        }

        // Request
        await fetchData({ api: "user/reset/password/", method: "post", data: data });


        onReset();
        // handleDispatch("savePdf", "true");
    }

    const disabled = load || !!response;
    const [formState, formAction, pending] = useActionState(onSubmit, { errors: null });
    const errors = formState.errors;
    
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
                        users={users}
                        passwordLength={passwordLength}
                        disabled={load || !!response}
                        setGenerated={val => handleDispatch("isGenerated", val)}
                        onChange={onChange} />}

                </div>

                {/* Response message */}
                {!!response && <Message res={response} cancel={() => handleResponse()} />}


                {/* Password form */}
                <form key={isCleaned} className='user-view-form fade-in' action={formAction}>

                    {children}

                    {/* Passwords inputs */}
                    {isVisible && fields?.map((field, i) => {

                        const value = formState[field.name] ?? formData?.password ?? "";

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
                                className={`field ${(errors?.[field.name] ? "error" : '')}`}
                                error={errors?.[field.name]}
                                placeholder={field?.placeholder}
                                disabled={pending}
                                helpText={errors?.[field.name]}
                            />
                        </FormControl>
                    })}


                    {/* Buttons */}
                    <FormButtons
                        label={multiple ? "Granska" : "Verkställ"}
                        disabled={!formData && !isChanged}
                        confirmable={true}
                        loading={load && !response}
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
                    </FormButtons>
                </form>
            </div>
        </>

    )
}

export default Form;