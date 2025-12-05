import { useEffect, useRef, use, useReducer, useActionState } from 'react';
import _ from 'lodash'; // To compare two objects for identity

// Installed
import {
    Checkbox, FormControl, FormControlLabel, FormLabel, Radio, TextField, Tooltip
} from '@mui/material';

// Components
import ModalHelpTexts from '../modals/ModalHelpTexts';
import ModalView from '../modals/ModalView';
import Message from '../blocks/Message';
import PDFConverter from '../blocks/PDFConverter';
import FormButtons from './FormButtons';
import ListCategories from './../lists/ListCategories';

// Functions
// import SessionData from '../../functions/SessionData';
import { DecodedToken } from '../../functions/DecodedToken';

// Functions
import PasswordGeneration from '../blocks/PasswordGeneration';

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
    noConfirm: false,
    requirementError: false,
    regexError: false,
    inputNam: '',
    password: "",
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
    passType: "",
    limitedChars: true
};

// Action reducer
function actionReducer(state, action) {
    const obj = action.payload ? action.payload : null;
    switch (action.type) {
        case "PARAM":
            return {
                ...state, [action.name]: obj
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
                ...state, load: false, requirementError: false, passType: "", limitedChars: false,
                selectedCategory: "", wordsList: [], isGenerated: false
            };
        case "RESET_FORM_TOTAL":
            return {
                ...state, requirementError: false, showPassword: false, numbersCount: 0, variousPassword: false,
                selectedCategory: "", wordsList: [], isGenerated: false, noConfirm: false, passType: "", limitedChars: false,
                regexError: false, inputName: ''
            };
        default:
            return state;
    }
}
// setLimitedChars(multiple);

function Form({ title, passwordLength, users }) {

    const { group } = use(AuthContext);
    const multiple = users.length > 1;

    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { showPassword, password, noConfirm, requirementError, regexError, inputName, variousPassword,
        selectedCategory, isOpenTip, wordsList, numbersCount, previewList, confirmSavePdf, savePdf, savedPdf, isGenerated, passType, limitedChars } = state;

    const { response, pending: load, fetchData, handleResponse } = use(FetchContext);

    const strongRegex = passwordLength === 12;
    // Regex to validate password 
    const regex = strongRegex ?
        /^(?=.*[0-9])(?=.*[!@?$&#^%*-,;._])[A-Za-z0-9!@?$&#^%*-,;._]{12,50}$/ : /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9]{8,50}$/;
    const eng = /^[A-Za-z]+$/;

    // Student school and class
    const location = users[0]?.office?.replace("%20", " ") + "%" + users[0]?.department?.replace("%20", " ");

    // To manipulate elements like js getElementById
    const refSubmit = useRef(null);
    const refModal = useRef(null);
    const refGenerate = useRef(null);

    const decodedToken = DecodedToken();
    const developer = decodedToken?.Roles?.indexOf("Developer") > -1;

    // Help texts (password)
    const helpTexts = [
        {
            primary: "Lösenord ska innehålla",
            secondary: "<br/>* Minst en stor bokstav, ej <b>Ö, Ä, Å</b>" +
                "<br/>* Minst en liten liten bokstav, ej <b>ö, ä, å</b>" +
                "<br/>* Minst en siffra" +
                (strongRegex) ? "<br/>* Minst ett specialtecken, exempelvis !@?$&#^%*-,;._</br>" : "" +
                "<br/>* Minst " + passwordLength + " tecken långt"
        }
    ]

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


    // Set password typesetPreviewList
    const setPassTypeValue = (value) => {
        resetForm();
        handleDispatch("passType", value);
    }

    // Set limited chars
    const switchCharsLimit = (value) => {
        handleDispatch("limitedChars", value);

        if (wordsList.length > 0)
            handleDispatch("wordsList", []);
        if (selectedCategory.length > 0)
            handleDispatch("selectedCategory", "");

        handleDispatch("numbersCount", value ? 0 : 3);
    }

    // Switch password numbers count
    const switchNumbersCount = (value) => {
        handleDispatch("numbersCount", value);
        handleDispatch("previewList", []);
    }

    // Password words category
    const handleSelectListChange = (list) => {
        handleDispatch("previewList", []);
        handleDispatch("wordsList", list);
    }

    const passwordWordChange = (e) => {
        handleDispatch("previewList", []);
        let lng = e?.target?.value?.length;
        if (lng > 0)
            handleDispatch("wordsList", [e.target.value?.replace(" ", "")]);
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

    // Submit form
    // Function - submit form
    async function onSubmit(previous, fd) {
        let data = {
            password: fd.get("password"),
            confirmPassword: fd.get("confirmPassword"),
            users: [],
            check: false
        };

        let errors = [];

        if (data.password?.length < passwordLength)
            errors.push("password");
        if (data.password !== data.confirmPassword)
            errors.push("confirmPassword");

        data.users = users?.map((user) => {
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

    // Update session list of changed passwords
    // const setSessionHistory = (data) => {

    //     let sessionData = {
    //         primary: ((!data.username ? location : data.username)?.replace("%", " "))?.replace("\" ", ""),
    //         secondary: data.users?.length === 0 ? ("Lösenord: " + data.password) : ("Elever: " + data.users?.length),
    //         link: data.users?.length === 0 ? `/manage-user/${data?.username}` : null,
    //         includedList: data.users?.map((user) => {
    //             return {
    //                 primary: (user.username?.replace("%", " "))?.replace("\" ", ""),
    //                 secondary: "Lösenord: " + user.password,
    //                 link: `/manage-user/${user.username}`
    //             }
    //         })
    //     }

    //     let sessionPasswordsList = SessionData("sessionWork");
    //     sessionPasswordsList.push(sessionData);

    //     sessionStorage.setItem("sessionWork", JSON.stringify(sessionPasswordsList));
    // }

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
console.log(password)
    return (
        <>
            <div className='form-wrapper w-100'>

                <div className="d-row jc-between">

                    {/* Title */}
                    <h2 className='form-title'>{title}</h2>

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
                        updatePasswordForm={(value) => handleDispatch("password", value)}
                        updatePreviewList={(list) => handleDispatch("previewList", list)}
                        ref={refGenerate} />
                </div>

                {/* Response message */}
                {!!response && <Message res={response} cancel={() => handleResponse()} />}


                {/* Password form */}
                <form className='user-view-form' action={formAction}>

                    {multiple && <>
                        {/* Loop of radio input choices to choose is password same or not for all students */}
                        {[{ label: "Samma lösenord", value: false }, { label: "Olika lösenord", value: true }].map((p, index) => (
                            <FormControlLabel
                                key={index}
                                control={<Radio size='small' />}
                                checked={p.value === variousPassword}
                                label={p.label}
                                name="samePassword"
                                onChange={() => handleDispatch("variousPassword", p.value)} />
                        ))}

                        {/* Different alternatives for password generation */}
                        <div className={`dropdown-div${(variousPassword ? " dropdown-open" : "")}`}>
                            <div className='dropdown-interior-div'>
                                {/* Loop of radio input choices to choose password type strong or not */}
                                <FormLabel className="label">Lösenordstyp</FormLabel>
                                {[
                                    { label: "Komplicerad", tips: "Genererad av slumpmässiga tecken", color: "error", value: "strong" },
                                    { label: "Lagom", tips: "Olika ord & siffror", color: "blue", value: "medium" },
                                    { label: "Enkelt", tips: "Ett liknande ord för alla lösenord med olika siffror.", color: "green", value: "easy" }
                                ].map((p, index) => (
                                    <Tooltip
                                        key={index}
                                        title={p.tips}
                                        classes={{
                                            tooltip: `tooltip tooltip-margin tooltip-${p.color}`,
                                            arrow: `arrow-${p.color}`
                                        }} arrow>
                                        <FormControlLabel
                                            control={<Radio
                                                size='small'
                                                checked={p.value === passType}
                                                color={passType === "strong" ? "error" : (passType === "medium" ? "primary" : "success")} />}
                                            label={p.label}
                                            name="passType"
                                            onChange={() => setPassTypeValue(p.value)} />
                                    </Tooltip>
                                ))}

                                {/* Choice of password length */}
                                {(passType === "medium" || passType === "easy") &&
                                    <><FormLabel className="label-small">Lösenords längd</FormLabel>
                                        {[{ label: "Total 8 tecken", value: true },
                                        { label: "Från 8 tecken", value: false }].map((p, index) => (
                                            <FormControlLabel
                                                key={index}
                                                control={<Radio
                                                    size='small'
                                                    checked={p.value === limitedChars}
                                                    color="info" />}
                                                label={p.label}
                                                name="digits"
                                                onChange={() => switchCharsLimit(p.value)} />
                                        ))}
                                    </>}

                                {/* Choice of password category */}
                                {passType === "medium" &&
                                    <ListCategories
                                        limitedChars={limitedChars}
                                        label="Lösenords kategory"
                                        selectChange={(list) => handleSelectListChange(list)}
                                        // reset={_.isEqual(formData, defaultForm)}
                                        multiple={true}
                                    />}

                                {/* Input for password word */}
                                {passType === "easy" &&
                                    <FormControl className='select-list'>
                                        <TextField
                                            label="Ord"
                                            placeholder={`Ditt ord för lösenord ${limitedChars ? ', från 5 upp till 6 tecken lång' : ''}`}
                                            value={wordsList[0]}
                                            name="passwordWord"
                                            inputProps={{
                                                maxLength: limitedChars ? 6 : 16,
                                                minLength: 3
                                            }}
                                            onChange={(e) => passwordWordChange(e)}
                                        />
                                    </FormControl>}

                                {/* List of password examples */}
                                {(wordsList.length > 0 && passType === "medium" && !limitedChars) &&
                                    <div className="last-options">
                                        <FormLabel className="label-small">Lösenords alternativ (antal siffror i lösenord)</FormLabel>
                                        {["012", "01", "0"].map((param, index) => {
                                            return <FormControlLabel
                                                key={index}
                                                control={<Radio
                                                    size='small'
                                                    checked={param.length === numbersCount}
                                                    color="info" />}
                                                label={<Tooltip title={`Lösenord med ${param.length} siffra i slutet`} arrow><span>Password{param}</span></Tooltip>}
                                                name="digits"
                                                onChange={() => switchNumbersCount(param.length)} />
                                        })}
                                    </div>}
                            </div>
                        </div>
                    </>}

                    {/* Passwords inputs */}
                    {/* <div className={`inputs-wrapper dropdown-div${(!variousPassword ? " dropdown-open" : "")}`}> */}
                    {fields.length > 0 && fields.map((n, i) => (
                        <FormControl key={i} fullWidth>
                            <TextField
                                label={n.label}
                                name={n.name}
                                type={showPassword ? "text" : "password"}
                                variant="outlined"
                                required
                                value={password || ""}
                                inputProps={{
                                    minLength: passwordLength,
                                    autoComplete: fields[n.name],
                                    form: { autoComplete: 'off', }
                                }}
                                className={`field ${(inputName === n.name && (requirementError || regexError)) ? "error" : ''}`}
                                error={(n.name === "confirmPassword" && noConfirm) || (inputName === n.name && (requirementError || regexError))}
                                placeholder={n.placeholder}
                                // disabled={variousPassword || (n.name === "confirmPassword" && formData.password?.length < passwordLength)}
                                onChange={(value) => handleDispatch("password", value)}
                                // onBlur={validateField}
                                helperText={(inputName === n.name) &&
                                    ((regexError && "Ej tillåten tecken")
                                        || (requirementError && "Uppyller ej lösenordskraven")
                                        || (noConfirm && "Lösenorden matchar inte"))}
                            />
                        </FormControl>))}
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

                        <div className='d-row jc-between w-100'>
                            {/* Change the password input type */}
                            {!variousPassword && <FormControlLabel className='checkbox'
                                control={<Checkbox
                                    size='small'
                                    disabled={disabled}
                                    checked={showPassword}
                                    onClick={() => handleDispatch("showPassword", !showPassword)} />}
                                label="Visa lösenord" />}

                            <div className='d-row jc-end w-100'>
                                {/* Change the password input type */}
                                {developer && <FormControlLabel
                                    className='checkbox'
                                    title="Spara inte logfilen"
                                    control={<Checkbox
                                        size='small'
                                        name="check"
                                        disabled={disabled} />}
                                    label="Testing" />}
                            </div>

                            {/* Hidden submit input, used for class members password change */}
                            {previewList?.length > 0 && <input type="submit" className='none' value="" ref={refSubmit} />}
                        </div>
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

            {/* Modal  window with help texts */}
            <ModalView
                label="Lösenordskrav"
                content={helpTexts} />
        </>

    )
}

export default Form;