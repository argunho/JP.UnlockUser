import { useEffect, useRef, use, useReducer, useActionState } from 'react';

// Installed
import {
    Checkbox, FormControl, FormControlLabel, TextField, IconButton
} from '@mui/material';
import { Abc, Password } from '@mui/icons-material';

// Components
import ModalHelpTexts from '../modals/ModalHelpTexts';
import ModalView from '../modals/ModalView';
import Message from '../blocks/Message';
import PDFConverter from '../blocks/PDFConverter';
import FormButtons from './FormButtons';
import MultiplePassword from '../blocks/MultiplePassword';
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
    noConfirm: false,
    requirementError: false,
    regexError: false,
    inputNam: '',
    formData: null,
    variousPassword: false,
    selectedCategory: "",
    isOpenTip: false,
    wordsList: [],
    numbersCount: 0,
    previewList: [],
    confirmSavePdf: false,
    savePdf: false,
    savedPdf: null,
    isGenerated: false,
    passType: ""
};

// Action reducer
function actionReducer(state, action) {
    const payload = action.payload ? action.payload : null;
    switch (action.type) {
        case "PARAM":
            return {
                ...state, [action.name]: payload
            };
        case "CLOSE_MODAL":
            return {
                ...state, open: false, page: 1, blink: true, sorting: true
            };
        case "RESET_ERROR":
            return {
                ...state, regexError: false, requirementError: false, inputName: '', noConfirm: false
            };
        case "RESET_FORM_PARTIAL":
            return {
                ...state, load: false, requirementError: false, passType: "",
                selectedCategory: "", wordsList: [], isGenerated: false
            };
        case "RESET_FORM_TOTAL":
            return {
                ...state, requirementError: false, showPassword: false, numbersCount: 0, variousPassword: false,
                selectedCategory: "", wordsList: [], isGenerated: false, noConfirm: false, passType: "",
                regexError: false, inputName: ''
            };
        default:
            return state;
    }
}

function Form({ title, passwordLength, users }) {

    const { group } = use(AuthContext);
    const multiple = users.length > 1;

    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { showPassword, formData, noConfirm, requirementError, regexError, inputName, variousPassword,
        selectedCategory, isOpenTip, wordsList, numbersCount, previewList, confirmSavePdf, savePdf, savedPdf, isGenerated, passType } = state;

    const { response, pending: load, fetchData, handleResponse } = use(FetchContext);

    // Regex to validate password 
    const regex = passwordLength === 12 ?
        /^(?=.*[0-9])(?=.*[!@?$&#^%*-,;._])[A-Za-z0-9!@?$&#^%*-,;._]{12,50}$/ : /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9]{8,50}$/;

    // Student school and class
    const location = users[0]?.office?.replace("%20", " ") + "%" + users[0]?.department?.replace("%20", " ");

    // To manipulate elements like js getElementById
    const refSubmit = useRef(null);
    const refModal = useRef(null);
    const refGenerate = useRef(null);

    const decodedToken = DecodedToken();
    const developer = decodedToken?.Roles?.indexOf("Developer") > -1;

    useEffect(() => {
        if (isOpenTip)
            handleDispatch("isOpenTip", false);
    }, [isOpenTip])

    useEffect(() => {
        resetForm(!variousPassword);
    }, [variousPassword])

    useEffect(() => {
        if (savedPdf != null && savePdf)
            sendEmailWithFile();
    }, [savedPdf])

    useEffect(() => {
        if (isGenerated && previewList.length === 0) {
            resetForm();
            handleDispatch("showPassword", true);
        }
        resetError();
    }, [isGenerated])


    function handleDispatch(name, value) {
        dispatch({ type: "PARAM", name: name, payload: value });
    }

    // Reset validation error from specific form field 
    const resetError = () => {
        dispatch({ type: "RESET_ERROR" });
    }

    // Apply and save pdf
    const saveApply = (save) => {
        handleDispatch("confirmSavePdf", save);
        refSubmit.current.click();
    }

    // Reset form
    const resetForm = (resetTotal = false) => {
        if (!resetTotal)
            dispatch({ type: "RESET_FORM_PARTIAL" });
        else
            dispatch({ type: "RESET_FORM_TOTAL" });

        if (!savePdf)
            handleDispatch("previewList", []);
    }

    function onChange(data) {
        console.log(data)
        handleDispatch("formData", data);
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


        resetForm(true);
        handleDispatch("savePdf", "true");
    }

    // Send email to current user with saved pdf document
    const sendEmailWithFile = async () => {
        const inf = location.split("%");
        const data = new FormData();
        data.append('attachedFile', savedPdf);

        await fetchData({ api: `user/mail/${inf[1]} ${inf[0]}`, method: "post", data: data });
        handleDispatch("confirmSavePdf", false);
        handleDispatch("savePdf", false);
    }

    const handleModalOpen = () => {
        if (!variousPassword) return;
        refModal.current?.click();
    }

    const disabled = load || !!response;
    const [formState, formAction, pending] = useActionState(onSubmit, { errors: null });

    return (
        <>
            <div className='form-wrapper w-100'>

                <div className="d-row jc-between">

                    {/* Title */}
                    <h2 className='label'>
                        {title}

                        {/* Modal  window with help texts */}
                        <ModalView
                            label="Lösenordskrav"
                            content={PasswordTips(passwordLength)} />
                    </h2>

                    {/* Generate password */}
                    <PasswordGeneration
                        disabledTooltip={passType === "medium" && wordsList.length === 0}
                        disabledClick={(variousPassword && !passType)
                            || (passType === "easy" && (wordsList.length === 0 || wordsList[0]?.length < 5))}
                        regex={regex}
                        users={users}
                        wordsList={wordsList}
                        numbersCount={numbersCount}
                        strongPassword={passType === "strong"}
                        variousPasswords={variousPassword}
                        passwordLength={passwordLength}
                        disabled={load || !!response}
                        regenerate={previewList.length > 0}
                        setGenerated={val => handleDispatch("isGenerated", val)}
                        onChange={onChange}
                        updatePreviewList={(list) => handleDispatch("previewList", list)}
                        ref={refGenerate} />
                </div>

                {/* Response message */}
                {!!response && <Message res={response} cancel={() => handleResponse()} />}


                {/* Password form */}
                <form className='user-view-form' action={formAction}>

                    {multiple && <MultiplePassword selected={selectedCategory} />}

                    {/* Passwords inputs */}
                    {/* <div className={`inputs-wrapper dropdown-div${(!variousPassword ? " dropdown-open" : "")}`}> */}
                    {fields?.map((field, i) => {

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
                                InputProps={(!variousPassword && field.name === "password") ? {
                                    endAdornment: (
                                        <IconButton
                                            disabled={disabled || (!variousPassword && (noConfirm || requirementError || regexError))
                                                || (variousPassword && previewList.length === 0)}
                                            onClick={() => handleDispatch("showPassword", !showPassword)}
                                            title="Visa lösenord">
                                            {showPassword ? <Abc /> : <Password />}
                                        </IconButton>
                                    )
                                } : undefined
                                }
                                className={`field ${(inputName === field.name && (requirementError || regexError)) ? "error" : ''}`}
                                error={(field.name === "confirmPassword" && noConfirm) || (inputName === field.name && (requirementError || regexError))}
                                placeholder={field?.placeholder}
                                disabled={pending}
                                helperText={(inputName === field.name) &&
                                    ((regexError && "Ej tillåten tecken")
                                        || (requirementError && "Uppyller ej lösenordskraven")
                                        || (noConfirm && "Lösenorden matchar inte"))}
                            />
                        </FormControl>
                    })}
                    {/* </div> */}


                    {/* Buttons */}
                    <FormButtons
                        label={variousPassword ? "Granska" : "Verkställ"}
                        disabled={disabled || (!variousPassword && (noConfirm || requirementError || regexError))
                            || (variousPassword && previewList.length === 0)}
                        confirmable={!variousPassword}
                        loading={load && !response}
                        variant="contained"
                        run={variousPassword}
                        submit={handleModalOpen}
                        cancelDisabled={disabled}
                        cancel={() => resetForm(true)}
                    >

                        <div className='d-row jc-start w-100'>
                            {/* Change the password input type */}
                            {developer && <FormControlLabel
                                className='checkbox'
                                title="Spara inte logfilen"
                                control={<Checkbox
                                    name="check"
                                    disabled={disabled} />}
                                label="Test" />}
                        </div>

                        {/* Hidden submit input, used for class members password change */}
                        {previewList?.length > 0 && <input type="submit" className='none' value="" ref={refSubmit} />}

                    </FormButtons>
                </form>


                {/* Save document to pdf */}
                {(savePdf && confirmSavePdf) && <PDFConverter
                    name={title}
                    subTitle={location.replace("%", " ")}
                    names={["Namn", "Lösenord"]}
                    list={previewList}
                    savedPdf={(pdf) => handleDispatch("savedPdf", pdf)}
                />}
            </div>

            {/* Preview the list of generated passwords */}
            {multiple && <ModalHelpTexts
                data={previewList}
                cls="none"
                isTitle={`${title} <span class='office-span'>${location.replace("%", " ")}</span>`}
                isTable={true}
                isSubmit={true}
                regeneratePassword={() => refGenerate?.current?.click()}
                inverseFunction={(save) => saveApply(save)}
                ref={refModal} />}
        </>

    )
}

export default Form;