import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
    Button, Checkbox, CircularProgress,
    FormControl, FormControlLabel, FormLabel, Radio, TextField, Tooltip
} from '@mui/material';
import { ClearOutlined, ManageSearch, Save } from '@mui/icons-material';

import ModalHelpTexts from './ModalHelpTexts';
import Response from './Response';
import PDFConverter from './PDFConverter';
import PasswordGeneration from './PasswordGeneration';
import TokenConfig from '../functions/TokenConfig';
import ListCategories from './ListCategories';

// To compare two objects for identity
import _ from 'lodash';

// Don't remove this comment line below, this uses for useEffect
/* eslint-disable react-hooks/exhaustive-deps */

// Form inputs
const formList = [
    { name: "password", label: "Lösenord", placeholder: "" },
    { name: "confirmPassword", label: "Bekräfta lösenord", placeholder: "" }
]

export default function Form(props) {
    Form.displayName = "Form";

    const { title, api, name, multiple, passwordLength, users = [] } = props;
    const defaultForm = {
        password: "",
        confirmPassword: "",
        users: []
    };

    const [response, setResponse] = useState(null);
    const [load, setLoad] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [noConfirm, setNoConfirm] = useState(false);
    const [requirementError, setRequirementError] = useState(false);
    const [regexError, setRegexError] = useState(false);
    const [confirmSubmit, setConfirmSubmit] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [inputName, setInputName] = useState('');
    const [variousPassword, setVariousPassword] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [disabled, setDisabled] = useState(false);
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

    // Regex to validate password  (!@?$&#^%*_)
    const regex = strongRegex ?
        /^(?=.*[0-9])(?=.*[!@?$&#^%*-,;._])[a-zA-Z0-9!@?$&#^%*-,;._]{12,50}$/ : /^[a-zA-Z0-9]{8,50}$/;
    const eng = /^[A-Za-z]+$/;

    // Student school and class
    const location = (users.length > 0) ? users[0]?.office + " " + users[0]?.department : "";

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
        setForm(defaultForm);
    }, [variousPassword])

    useEffect(() => {
        setDisabled()
    }, [form])

    useEffect(() => {
        if (savedPdf != null && savePdf)
            sendEmailWithFile();
    }, [savedPdf])

    useEffect(() => {
        if (props.setDisabled && !props.disabled)
            props.setDisabled(load);
        
        setDisabled(load || confirmSubmit || response || props.disabled);
    }, [load, confirmSubmit, response, props.disabled])

    useEffect(() => {
        if (isGenerated && previewList.length === 0) {
            resetForm();
            setShowPassword(true);
        }

        resetError();
    }, [isGenerated])

    // Set password type
    const setPassTypeValue = (value) => {
        resetForm();
        setForm(defaultForm);
        setPassType(value);
    }

    // Set limited chars
    const switchCharsLimit = (value) => {
        setLimitedChars(value);
        if (wordsList.length > 0)
            setWordsList([]);
        if (selectedCategory.length > 0)
            setSelectedCategory("");

        setNumbersCount(value ? 0 : 3);
    }

    // Switch password numbers count
    const switchNumbersCount = (value) => {
        setNumbersCount(value);
        setForm(defaultForm);
        setPreviewList([]);
    }

    // Password words category
    const handleSelectListChange = (list) => {
        setPreviewList([]);
        setWordsList(list);
        setForm(defaultForm);
    }

    // Handle change of form value
    const valueChangeHandler = (e) => {
        if (!e?.target) return;
        const value = e?.target.value;

        setForm({ ...form, [e.target.name]: value?.replace(" ", "") });

        resetForm();
        validateField(e);
    }

    const passwordWordChange = (e) => {
        setWordsList([]);
        let lng = e?.target?.value?.length;
        if (lng > 0)
            setWordsList([e.target.value?.replace(" ", "")]);
    }

    // Validate form's field
    const validateField = (e) => {
        if (e?.target && e.target?.value) {
            setInputName(e.target?.name);
            const value = e.target?.value;

            if (form.confirmPassword) {
                // Confirm new password and confirmPassword
                setNoConfirm((e.name === "password") ? form.confirmPassword !== value
                    : form.password !== value)
            }

            // Check and set error to true if the value contains a non-English character
            value.split("").forEach(char => {
                if (char.toLowerCase() !== char.toUpperCase())
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

    // Confirm action
    const confirmHandle = () => {
        setConfirmSubmit(false);
        setConfirmed(true);
        setTimeout(() => {
            refSubmit.current.click();
        }, 500)
    }

    // Apply and save pdf
    const saveApply = () => {
        setConfirmSavePdf(true);
        refSubmit.current.click();
    }

    // Reset form
    const resetForm = (resetTotal = false) => {
        setRequirementError(false);
        setConfirmed(false);
        setPassType("");
        setLimitedChars(multiple);
        setConfirmSubmit(false);
        setSelectedCategory("");
        setWordsList([]);
        setIsGenerated(false);

        if (!savePdf) setPreviewList([]);

        if (resetTotal) {
            setNoConfirm(false);
            setForm(defaultForm);
            resetError();
            setShowPassword(false);
            setNumbersCount(0);
            setVariousPassword(false);
            setConfirmSavePdf(false);
            setSavePdf(false);
            setResponse(null);
        }
    }

    // Reset preview list
    const resetPreviewList = () => {
        if (confirmSubmit) return;
        setPreviewList([]);
    }

    // Submit form
    const submitForm = async (e) => {
        e.preventDefault();

        if (!confirmed) {
            setConfirmSubmit(true);
            return;
        } else
            setConfirmSubmit(false);

        setLoad(true);

        let formValues = form;
        formValues.username = name;

        // Request
        await axios.post("user/" + api, formValues, TokenConfig()).then(res => {
            setResponse(res.data);
            setLoad(false);
            if (res.data?.success) {
                setSavePdf(confirmSavePdf);
                setTimeout(() => {
                    resetForm(true);
                }, 5000)
            }
        }, error => {
            // Handle of error
            resetForm();
            setLoad(false);
            if (error?.response.status === 401) setAccessDenied(true);
            else
                console.error("Error => " + error.response);
        })
    }

    // Send email to current user with saved pdf document
    const sendEmailWithFile = async () => {

        const inf = location.split(" ");
        const data = new FormData();
        data.append('attachedFile', savedPdf);

        await axios.post(`user/mail/${inf[1]} ${inf[0]}`, data, TokenConfig()).then(res => {
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

                {/* Confirm actions block */}
                {confirmSubmit && <div className='confirm-wrapper'>
                    <div className='confirm-block'>
                        Är du säker att du vill göra det?
                        <div className='buttons-wrapper'>
                            <Button type="submit" variant='contained' color="error" onClick={() => confirmHandle()}>Ja</Button>
                            <Button variant='contained' color="primary" onClick={() => resetForm()}>Nej</Button>
                        </div>
                    </div>
                </div>}

                {/* Modal  window with help texts */}
                <ModalHelpTexts arr={helpTexts} isTitle="Lösenordskrav" />

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
                                        reset={_.isEqual(form, defaultForm)}
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
                                        {["012", "01", "0"].map((param, index) => (
                                            <FormControlLabel
                                                key={index}
                                                control={<Radio
                                                    size='small'
                                                    checked={param.length === numbersCount}
                                                    color="info" />}
                                                label={"Password" + param}
                                                name="digits"
                                                onChange={() => switchNumbersCount(param.length)} />
                                        ))}
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
                                        value={form[n.name] || ""}
                                        inputProps={{
                                            minLength: passwordLength,
                                            autoComplete: formList[n.name],
                                            form: { autoComplete: 'off', }
                                        }}
                                        className={(inputName === n.name && (requirementError || regexError)) ? "error" : ''}
                                        error={(n.name === "confirmPassword" && noConfirm) || (inputName === n.name && (requirementError || regexError))}
                                        placeholder={n.placeholder}
                                        disabled={disabled || variousPassword || (n.name === "confirmPassword" && form.password?.length < passwordLength)}
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
                        <div className='buttons-wrapper' style={variousPassword ? { justifyContent: 'flex-end' } : {}}>
                            {/* Change the password input type */}
                            {!variousPassword && <FormControlLabel className='checkbox'
                                control={<Checkbox
                                    size='small'
                                    checked={showPassword}
                                    disabled={disabled}
                                    onClick={() => setShowPassword(!showPassword)} />}
                                label="Visa lösenord" />}

                            <div className='buttons-interior-wrapper'>

                                {/* Generate password */}
                                <PasswordGeneration
                                    disabledTooltip={passType === "medium" && wordsList.length === 0}
                                    disabledClick={disabled || (variousPassword && !passType)
                                        || (passType === "easy" && (wordsList.length === 0 || wordsList[0]?.length < 5))}
                                    regex={regex}
                                    users={users}
                                    wordsList={wordsList}
                                    numbersCount={numbersCount}
                                    strongPassword={passType === "strong"}
                                    variousPasswords={variousPassword}
                                    passwordLength={passwordLength}
                                    regenerate={(previewList.length > 0 || !_.isEqual(form, defaultForm)) && !disabled}
                                    setGenerated={val => setIsGenerated(val)}
                                    updatePasswordForm={(form) => setForm(form)}
                                    updatePreviewList={(list) => setPreviewList(list)}
                                    ref={refGenerate} />

                                {/* Reset form - button */}
                                <Button variant="contained"
                                    color="error"
                                    type="button"
                                    disabled={disabled || _.isEqual(form, defaultForm)}
                                    onClick={() => resetForm(true)}
                                ><ClearOutlined /></Button>

                                {/* Submit form - button */}
                                <Button variant="contained"
                                    ref={refSubmit}
                                    className={'button-btn button-action' + (variousPassword ? " none" : "")}
                                    color="primary"
                                    type='submit'
                                    disabled={disabled || _.isEqual(form, defaultForm) || 
                                        (!variousPassword && (noConfirm || requirementError || regexError))}>
                                    {load && <CircularProgress style={{ width: "15px", height: "15px", marginTop: "3px" }} />}
                                    {!load && <><Save /> <span>Verkställ</span></>}</Button>

                                {/* Preview modal - button */}
                                {variousPassword && <Button variant="contained"
                                    className='button-btn button-action'
                                    color="info"
                                    onClick={() => refModal?.current.click()}
                                    disabled={previewList.length === 0 || disabled}>
                                    <ManageSearch />
                                    <span>Granska</span>
                                </Button>}

                            </div>
                        </div>
                    </form>
                </div>

                {/* Preview the list of generated passwords */}
                {multiple && <ModalHelpTexts
                    arr={previewList}
                    cls={" none"}
                    isTitle={`${title} <span class='typography-span'>${location}</span>`}
                    isTable={true}
                    isSubmit={true}
                    resetList={() => resetPreviewList()}
                    regeneratePassword={() => refGenerate?.current?.click()}
                    inverseFunction={(save) => (save ? saveApply() : refSubmit.current.click())}
                    ref={refModal} />}

                {/* Save document to pdf */}
                {savePdf && <PDFConverter
                    name={title}
                    subTitle={location}
                    names={["Namn", "Lösenord"]}
                    list={previewList}
                    savedPdf={(pdf) => setSavedPdf(pdf)}
                />}
            </div >
        )
}
