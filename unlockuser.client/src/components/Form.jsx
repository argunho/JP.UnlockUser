import { useEffect, useRef, useState } from 'react';
import _ from 'lodash'; // To compare two objects for identity

// Installed
import {
    Button, Checkbox, CircularProgress,
    FormControl, FormControlLabel, FormLabel, Radio, TextField, Tooltip
} from '@mui/material';
import { ClearOutlined, ManageSearch, Save } from '@mui/icons-material';

// Components
import ModalHelpTexts from './ModalHelpTexts';
import Response from './Response';
import PDFConverter from './PDFConverter';
import PasswordGeneration from './PasswordGeneration';
import ListCategories from './ListCategories';

// Functions
import SessionHistory from '../functions/SessionHistoryData';

// Services
import ApiRequest from '../services/ApiRequest';

// Form inputs
const formList = [
    { name: "password", label: "Lösenord", placeholder: "" },
    { name: "confirmPassword", label: "Bekräfta lösenord", placeholder: "" }
]

function Form({ title, name, passwordLength, users, authContext }) {
    Form.displayName = "Form";

    const multiple = users.length > 1;

    const defaultForm = {
        password: "",
        confirmPassword: "",
        users: []
    };

    const [response, setResponse] = useState(null);
    const [load, setLoad] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState(defaultForm);
    const [noConfirm, setNoConfirm] = useState(false);
    const [requirementError, setRequirementError] = useState(false);
    const [regexError, setRegexError] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [inputName, setInputName] = useState('');
    const [variousPassword, setVariousPassword] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isOpenTip, setIsOpenTip] = useState(false);
    const [wordsList, setWordsList] = useState([]);
    const [numbersCount, setNumbersCount] = useState(0);
    const [accessDenied, setAccessDenied] = useState(false);
    const [previewList, setPreviewList] = useState([]);
    const [confirmSavePdf, setConfirmSavePdf] = useState(false);
    const [savePdf, setSavePdf] = useState(false);
    const [savedPdf, setSavedPdf] = useState(null);
    const [isGenerated, setIsGenerated] = useState(false);
    const [passType, setPassType] = useState("");
    const [limitedChars, setLimitedChars] = useState(true);

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

    // Help texts (password)
    const helpTexts = [
        {
            label: "Lösenord ska innehålla",
            tip: [
                "<pre>* Minst en stor bokstav, ej <b>Ö, Ä, Å</b></pre>",
                "<pre>* Minst en liten liten bokstav, ej <b>ö, ä, å</b></pre>",
                "<pre>* Minst en siffra</pre>",
                (strongRegex) ? "<pre>* Minst ett specialtecken, exempelvis !@?$&#^%*-,;._</pre>" : "",
                "<pre>* Minst " + passwordLength + " tecken långt</pre>"
            ]
        }
    ]

    useEffect(() => {
        if (isOpenTip)
            setTimeout(() => { setIsOpenTip(!isOpenTip) })
    }, [isOpenTip])

    useEffect(() => {
        resetForm(!variousPassword);
        setFormData(defaultForm);
    }, [variousPassword])

    useEffect(() => {
        if (savedPdf != null && savePdf)
            sendEmailWithFile();
    }, [savedPdf])

    useEffect(() => {
        if (isGenerated && previewList.length === 0) {
            resetForm();
            setShowPassword(true);
        }

        resetError();
    }, [isGenerated])

    // Set password typesetPreviewList
    const setPassTypeValue = (value) => {
        resetForm();
        setFormData(defaultForm);
        setPassType(value);
    }

    // Set limited chars
    const switchCharsLimit = (value) => {
        setLimitedChars(value);

        if (wordsList.length > 0)
            setWordsList([""]);
        if (selectedCategory.length > 0)
            setSelectedCategory("");

        setNumbersCount(value ? 0 : 3);
    }

    // Switch password numbers count
    const switchNumbersCount = (value) => {
        setNumbersCount(value);
        // setFormData(defaultForm);
        setPreviewList([]);
    }

    // Password words category
    const handleSelectListChange = (list) => {
        setPreviewList([]);
        setWordsList(list);
        setFormData(defaultForm);
    }

    // Handle change of formData value
    const valueChangeHandler = (e) => {
        if (!e?.target) return;
        const value = e?.target.value;

        setFormData({ ...formData, [e.target.name]: value?.replace(" ", "") });

        resetForm();
        validateField(e);
    }

    const passwordWordChange = (e) => {
        setPreviewList([]);
        let lng = e?.target?.value?.length;
        if (lng > 0)
            setWordsList([e.target.value?.replace(" ", "")]);
    }

    // Validate form's field
    const validateField = (e) => {
        if (e?.target && e.target?.value) {
            setInputName(e.target?.name);
            const value = e.target?.value;

            if (formData.confirmPassword) {
                // Confirm new password and confirmPassword
                setNoConfirm((e.name === "password") ? formData.confirmPassword !== value
                    : formData.password !== value)
            }

            // Check and set error to true if the value contains a non-English character
            value.split("").forEach(char => {
                if (char?.toLowerCase() !== char.toUpperCase())
                    setRegexError(!eng.test(char));
            });

            // Check and set error to true if the value  does not meet the requirement 
            setRequirementError(!regex.test(value));
        } else
            resetError(name);
    }

    // Reset validation error from specific form field 
    const resetError = () => {
        setRegexError(false);
        setRequirementError(false);
        setInputName('');
        setNoConfirm(false)
    }

    // Apply and save pdf
    const saveApply = (save) => {
        setConfirmSavePdf(save);
        refSubmit.current.click();
    }

    // Reset form
    const resetForm = (resetTotal = false) => {
        setLoad(false);
        setRequirementError(false);
        setPassType("");
        setLimitedChars(multiple);
        setConfirm(false);
        setSelectedCategory("");
        setWordsList([]);
        setIsGenerated(false);

        if (!savePdf) setPreviewList([]);

        if (resetTotal) {
            setNoConfirm(false);
            setFormData(defaultForm);
            resetError();
            setShowPassword(false);
            setNumbersCount(0);
            setVariousPassword(false);
            setConfirmSavePdf(false);
            setSavePdf(false);
            setResponse(null);
        }
    }

    // Submit click handle
    const submitClickHandle = () => {
        if (variousPassword)
            refModal?.current.click();
        else
            setConfirm(true);
    }

    // Submit form
    const submitForm = async (e) => {
        e.preventDefault();
        setConfirm(false);
        setLoad(true);
        const data = formData;

        if (data.users.length === 0) {
            let usersArray = [];
            for (var i = 0; i < users.length; i++) {
                usersArray.push({
                    username: users[i].name,
                    password: formData.password,
                    groupName: authContext?.group
                })
            }
            data.users = usersArray;
        }

        // Request
        await ApiRequest("user/reset/password/", "post", data).then(res => {
            setResponse(res.data);
            if (res.data?.success) {
                setSavePdf(true);
                setSessionHistory(formData);
                setTimeout(() => {
                    resetForm(true);
                }, 5000)
            } else
                setLoad(false);
        }, error => {
            // Handle of error
            resetForm();
            setLoad(false);
            if (error?.response.status === 401) setAccessDenied(true);
            else
                console.error("Error => " + error.response);
        })
    }

    // Update session list of changed passwords
    const setSessionHistory = (data) => {

        let sessionData = {
            primary: ((!data.username ? location : data.username)?.replace("%", " "))?.replace("\" ", ""),
            secondary: data.users?.length === 0 ? ("Lösenord: " + data.password) : ("Elever: " + data.users?.length),
            link: data.users?.length === 0 ? `/manage-user/${data?.username}` : null,
            includedList: data.users?.map((user) => {
                return {
                    primary: (user.username?.replace("%", " "))?.replace("\" ", ""),
                    secondary: "Lösenord: " + user.password,
                    link: `/manage-user/${user.username}`
                }
            })
        }
        
        let sessionPasswordsList = SessionHistory();
        sessionPasswordsList.push(sessionData);

        sessionStorage.setItem("sessionWork", JSON.stringify(sessionPasswordsList));
    }

    // Send email to current user with saved pdf document
    const sendEmailWithFile = async () => {
        const inf = location.split("%");
        const data = new FormData();
        data.append('attachedFile', savedPdf);

        await ApiRequest(`user/mail/${inf[1]} ${inf[0]}`, "post", data).then(res => {
            if (res.data?.errorMessage)
                console.error("Error response => " + res.data.errorMessage);
        }, error => {
            // Handle of error
            if (error?.response.status === 401) setAccessDenied(true);
            else console.error("Error => " + error.response)
        })
    }

    if (accessDenied)
        return <Response response={null} noAccess={true} />;
    else
        return (
            <div className='collapse-wrapper'>

                {/* The curtain over the block disables all action if the form data is submitted and waiting for a response */}
                {load && <div className='curtain-block'></div>}

                {/* Modal  window with help texts */}
                <ModalHelpTexts data={helpTexts} isTitle="Lösenordskrav" />

                {/* Title */}
                <p className='form-title'>{title}</p>

                {/* Response message */}
                {response && <Response response={response} reset={() => setResponse(null)} />}

                {/* Form actions */}
                <div className='form-actions'>

                    {multiple && <>
                        {/* Loop of radio input choices to choose is password same or not for all students */}
                        {[{ label: "Samma lösenord", value: false }, { label: "Olika lösenord", value: true }].map((p, index) => (
                            <FormControlLabel
                                key={index}
                                control={<Radio size='small' />}
                                checked={p.value === variousPassword}
                                label={p.label}
                                name="samePassword"
                                onChange={() => setVariousPassword(p.value)} />
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
                                    <Tooltip arrow
                                        key={index}
                                        title={p.tips}
                                        classes={{
                                            tooltip: `tooltip tooltip-margin tooltip-${p.color}`,
                                            arrow: `arrow-${p.color}`
                                        }}>
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
                                        reset={_.isEqual(formData, defaultForm)}
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

                    {/* Password form */}
                    <form className='user-view-form' onSubmit={submitForm}>
                        {/* Passwords inputs */}
                        <div className={`inputs-wrapper dropdown-div${(!variousPassword ? " dropdown-open" : "")}`}>
                            {formList.length > 0 && formList.map((n, i) => (
                                <FormControl key={i} className="pr-inputs">
                                    <TextField
                                        label={n.label}
                                        name={n.name}
                                        type={showPassword ? "text" : "password"}
                                        variant="outlined"
                                        required
                                        value={formData[n.name] || ""}
                                        inputProps={{
                                            minLength: passwordLength,
                                            autoComplete: formList[n.name],
                                            form: { autoComplete: 'off', }
                                        }}
                                        className={(inputName === n.name && (requirementError || regexError)) ? "error" : ''}
                                        error={(n.name === "confirmPassword" && noConfirm) || (inputName === n.name && (requirementError || regexError))}
                                        placeholder={n.placeholder}
                                        disabled={variousPassword || (n.name === "confirmPassword" && formData.password?.length < passwordLength) || confirm}
                                        onChange={valueChangeHandler}
                                        onBlur={validateField}
                                        helperText={(inputName === n.name) &&
                                            ((regexError && "Ej tillåten tecken")
                                                || (requirementError && "Uppyller ej lösenordskraven")
                                                || (noConfirm && "Lösenorden matchar inte"))}
                                    />
                                </FormControl>))}
                        </div>

                        {/* Buttons */}
                        {!confirm && <div className='buttons-wrapper' style={variousPassword ? { justifyContent: 'flex-end' } : {}}>
                            {/* Change the password input type */}
                            {!variousPassword && <FormControlLabel className='checkbox'
                                control={<Checkbox
                                    size='small'
                                    disabled={load}
                                    checked={showPassword}
                                    onClick={() => setShowPassword(!showPassword)} />}
                                label="Visa lösenord" />}

                            <div className='buttons-interior-wrapper'>

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
                                    disabled={load}
                                    regenerate={(previewList.length > 0 || !_.isEqual(formData, defaultForm))}
                                    setGenerated={val => setIsGenerated(val)}
                                    updatePasswordForm={(formData) => setFormData(formData)}
                                    updatePreviewList={(list) => setPreviewList(list)}
                                    ref={refGenerate} />

                                {/* Reset form - button */}
                                <Button variant="contained"
                                    color="error"
                                    type="button"
                                    disabled={load || _.isEqual(formData, defaultForm)}
                                    onClick={() => resetForm(true)}>
                                    <ClearOutlined />
                                </Button>

                                {/* Set confirm question & Preview modal button */}
                                <Button variant="contained"
                                    className="button-btn button-action"
                                    color="primary"
                                    type='button'
                                    onClick={submitClickHandle}
                                    disabled={load || _.isEqual(formData, defaultForm)
                                        || (!variousPassword && (noConfirm || requirementError || regexError))
                                        || (variousPassword && previewList.length === 0)}>
                                    {(load && !response) && <CircularProgress style={{ width: "15px", height: "15px", marginTop: "3px" }} />}
                                    {(!load || response) && <>
                                        {!variousPassword ? <Save /> : <ManageSearch />}
                                        <span>{variousPassword ? "Granska" : "Verkställ"}</span>
                                    </>}
                                </Button>

                                {/* Hidden submit input, used for class members password change */}
                                {previewList?.length > 0 && <input type="submit" className='none' value="" ref={refSubmit} />}
                            </div>
                        </div>}

                        {/* Confirm actions block */}
                        {confirm && <div className='buttons-wrapper confirm-wrapper'>
                            <p className='confirm-title'>Skicka?</p>
                            <Button className='button-btn button-action' type="submit" variant='contained' color="error">Ja</Button>
                            <Button className='button-btn button-action' variant='contained' color="primary" onClick={() => resetForm(true)}>Nej</Button>
                        </div>}
                    </form>
                </div>

                {/* Preview the list of generated passwords */}
                {multiple && <ModalHelpTexts
                    data={previewList}
                    cls={" none"}
                    isTitle={`${title} <span class='typography-span'>${location.replace("%", " ")}</span>`}
                    isTable={true}
                    isSubmit={true}
                    regeneratePassword={() => refGenerate?.current?.click()}
                    inverseFunction={(save) => saveApply(save)}
                    ref={refModal} />}

                {/* Save document to pdf */}
                {(savePdf && confirmSavePdf) && <PDFConverter
                    name={title}
                    subTitle={location.replace("%", " ")}
                    names={["Namn", "Lösenord"]}
                    list={previewList}
                    savedPdf={(pdf) => setSavedPdf(pdf)}
                />}
            </div >
        )
}

export default Form;
