import { useReducer, useRef, useEffect } from 'react';

// Installed
import { FormControlLabel, Radio, FormLabel, RadioGroup, Button } from "@mui/material";
import { TextField } from '@mui/material';

// Components
import PasswordCategories from '../lists/PasswordCategories';
import { GeneratePasswordWithRandomWord, GenerateStrongPassword } from './PasswordGeneration';
import ModalPreview from '../modals/ModalPreview';

const initialState = {
    samePassword: true,
    wordsList: [],
    numbersCount: 3,
    passwordType: "strong",
    inputWord: null,
    limit: 8,
    preview: null,
    actions: []
};

// Action reducer
function actionReducer(state, action) {
    const obj = action.payload ? action.payload : null;
    switch (action.type) {
        case "PARAM":
            return {
                ...state, [action.name]: obj
            };
        case "RESET":
            return {
                ...state, wordsList: [], numbersCount: 3, passwordType: "strong", inputWord: null, limit: 8, preview: null
            };
        default:
            return state;
    }
}

const passwords = [
    { label: "Samma lösenord", value: true },
    { label: "Olika lösenord", value: false }
];

const password_types = [
    { label: "Komplicerad", tips: "Genererad av slumpmässiga tecken", color: "error", value: "strong" },
    { label: "Lagom", tips: "Olika ord & siffror", color: "primary", value: "medium" },
    { label: "Enkelt", tips: "Ett liknande ord för alla lösenord med olika siffror.", color: "success", value: "simple" }
];

const password_limits = [
    { label: "Total 8 tecken", value: 8, color: "primary" },
    { label: "Från 8 tecken", value: NaN, color: "success" }
]

const password_digits = [
    { label: "Password012", value: 3, color: "error" },
    { label: "Password01", value: 2, color: "primary" },
    { label: "Password0", value: 1, color: "success" }
]

function MultiplePassword({ users, label, subLabel, disabled, onSwitch }) {

    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { samePassword, wordsList, inputWord, numbersCount, passwordType, limit, preview, actions } = state;

    const refChange = useRef(null);
    const refSubmit = useRef(null);

    useEffect(() => {
        if(disabled)
            handleDispatch("preview", null);
    }, [disabled])

    function handleDispatch(name, value) {
        dispatch({ type: "PARAM", name: name, payload: value });
    }

    function onChange(param, value) {
        dispatch({ type: "RESET" })
        handleDispatch(param, value);
    }

    function handleFormChange(value) {
        onChange("samePassword", value);
        setTimeout(() => {
            onSwitch(!value)
        }, value ? 1000 : 0)
    }

    // Generate multiple passwords
    function generatePasswords() {

        handleDispatch("preview", null);
        let preview = [];

        for (let i = 0; i < users?.length; i++) {
            let password = null;
            if (passwordType == "strong")
                password = GenerateStrongPassword(8);
            else if (passwordType === "medium") {
                let randomWord = null;
                while (true) {
                    const randomItem = wordsList[Math.floor(Math.random() * wordsList.length)];
                    randomWord = randomItem?.name ?? randomItem;
                    if (!limit || ((limit - numbersCount) >= randomWord?.length))
                        break;
                    password = GeneratePasswordWithRandomWord(randomWord, (limit ? limit : (randomWord?.length + numbersCount)), true);
                }
            } else if (passwordType === "simple")
                password = GeneratePasswordWithRandomWord(inputWord, (limit ? limit : (inputWord?.length + numbersCount)), true)

            preview.push({
                name: users[i].displayName,
                username: users[i].name,
                password: password
            })
        }

        handleDispatch("preview", preview);
    }

    return (
        <>
            {/* Loop of radio input choices to choose is password same or not for all students */}
            <RadioGroup
                row
                aria-labelledby="demo-radio-buttons-group-label"
                defaultValue={true}
                name="radio-password"
            >
                {passwords.map((radio, index) => (
                    <FormControlLabel
                        key={index}
                        {...radio}
                        control={<Radio />}
                        onChange={() => handleFormChange(radio.value)} />
                ))}
            </RadioGroup>

            {/* Different alternatives for password generation */}
            <div className={`dropdown-container w-100${!samePassword ? " open" : ""}`}>
                <div className='dropdown-wrapper'>

                    {/* Loop of radio input choices to choose password type strong or not */}
                    <FormLabel className="radio-label">Lösenordstyp</FormLabel>
                    <RadioGroup
                        row
                        key={samePassword?.toString()}
                        aria-labelledby="demo-radio-buttons-group-label"
                        defaultValue="strong"
                        name="radio-password-type"
                    >
                        {password_types.map((radio, index) => (
                            <FormControlLabel
                                key={index}
                                {...radio}
                                control={<Radio color={radio.color} />}
                                onChange={() => onChange("passwordType", radio.value)} />
                        ))}
                    </RadioGroup>


                    {/* Choice of password length */}
                    {["medium", "simple"].includes(passwordType) &&
                        <>
                            <FormLabel className="radio-label-small" >Lösenords längd</FormLabel>
                            <RadioGroup
                                row
                                key={passwordType}
                                aria-labelledby="demo-radio-buttons-group-label"
                                defaultValue={8}
                                name="radio-password-length"
                            >
                                {password_limits.map((radio, index) => (
                                    <FormControlLabel
                                        key={index}
                                        {...radio}
                                        control={<Radio color={radio.color} />}
                                        onChange={() => onChange("limit", radio.value)} />
                                ))}
                            </RadioGroup>
                        </>}

                    {/* Choice of password category */}
                    {passwordType === "medium" &&
                        <PasswordCategories
                            key={`${passwordType}${limit}`}
                            label="Lösenord kategories"
                            limit={limit}
                            multiple={true}
                            disabled={disabled}
                            onChange={(value) => handleDispatch("wordsList", value)} />}

                    {/* Input for password word */}
                    {passwordType === "simple" &&
                        <TextField
                            key={`${passwordType}${limit}`}
                            label="Ord"
                            className="field-word"
                            placeholder={`Ange ett ord för lösenord, som är ${limit ? 'minst 5 och max 6' : 'minst 5'} tecken långt`}
                            inputProps={{
                                maxLength: limit ? 6 : 16,
                                minLength: 3
                            }}
                            onChange={(e) => handleDispatch("inputWord", e.target.value)}
                        />}

                    {/* List of password examples */}
                    {(wordsList?.length > 0 && passwordType === "medium" && !limit) &&
                        <div className="last-options">
                            <FormLabel className="radio-label-small">Lösenords alternativ (välj antal siffror i slutet)</FormLabel>
                            <RadioGroup
                                row
                                key={`${passwordType}${limit}`}
                                aria-labelledby="demo-radio-buttons-group-label"
                                defaultValue={3}
                                name="radio-password-length"
                            >
                                {password_digits.map((radio, index) => {
                                    return <FormControlLabel
                                        key={index}
                                        {...radio}
                                        control={<Radio size='small' color={radio.color} />}
                                        onChange={() => handleDispatch("numbersCount", radio.value)}
                                    />
                                })}
                            </RadioGroup>
                        </div>}

                    <Button variant="text"
                        color="primary"
                        className="generate-password"
                        onClick={generatePasswords}
                        ref={refChange}
                        disabled={disabled || (passwordType == "medium" && wordsList?.length === 0)
                            || (passwordType === "simple" && (!inputWord || inputWord?.length < 5))}>
                        Generera lösenord
                    </Button>
                </div>
            </div>

            {/* Preview the list of generated passwords */}
            {preview && <ModalPreview
                list={preview}
                label={label}
                subLabel={subLabel}        
                onActionsChange={(value) => handleDispatch("actions", value)}
                onSubmit={() => refSubmit.current?.click()}
                onChange={() => refChange?.current?.click()}
                onClose={() => dispatch({ type: "RESET" })}
            />}

            {/* Checkbox choices (ave file, send email) */}
            {actions?.length > 0 && <input type="hidden" name="actions" className="none" defaultValue={JSON.stringify(actions)} />}

            {/* Hidden input */}
            {preview && <input type="hidden" name="users" className="none" defaultValue={JSON.stringify(preview)} />}

            {/* Hidden submit button */}
            <button type="submit" className="none" id="submit" ref={refSubmit} />
        </>
    )
}

export default MultiplePassword;