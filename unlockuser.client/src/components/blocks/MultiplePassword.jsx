import { useReducer } from 'react';

// Installed
import { FormControlLabel, Radio, FormLabel, Tooltip, RadioGroup, Button } from "@mui/material";
import { TextField, capitalize } from '@mui/material';

// Components
import PasswordCategories from '../lists/PasswordCategories';
import ReplaceLetters from './../../functions/ReplaceLetters';
import { GeneratePasswordWithRandomWord, GenerateStrongPassword } from './PasswordGeneration';


const initialState = {
    samePassword: true,
    wordsList: [],
    numbersCount: 0,
    passwordType: "strong",
    limit: 8,
    preview: []
};

// Action reducer
function actionReducer(state, action) {
    const obj = action.payload ? action.payload : null;
    switch (action.type) {
        case "PARAM":
            return {
                ...state, [action.name]: obj
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
    { label: "Total 8 tecken", value: 8 },
    { label: "Från 8 tecken", value: NaN }
]

const password_digits = [
    { label: "012", value: 3 },
    { label: "01", value: 2 },
    { label: "0", value: 1 }
]

function MultiplePassword({ users, disabled, onSwitch }) {
    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { samePassword, wordsList, numbersCount, passwordType, limit, preview } = state;

    // Regex to validate password 
    const regex = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9]{8,50}$/;
    const eng = /^[A-Za-z]+$/;
    const symbols = "!@?$&#^%*-,;._";
    const randomNumbers = [0, 10, 100, 1000];

    // // To manipulate elements like js getElementById
    // const refModal = useRef(null);

    function onChange(value) {
        handleDispatch("samePassword", value);
        setTimeout(() => {
            onSwitch(!value)
        }, value ? 1000 : 0)
    }

    function handleDispatch(name, value) {
        dispatch({ type: "PARAM", name: name, payload: value });
    }

    // Set limited chars
    const switchCharsLimit = (value) => {
        handleDispatch("limit", value);

        if (wordsList?.length > 0)
            handleDispatch("wordsList", []);

        handleDispatch("numbersCount", value ? 0 : 3);
    }

    // Switch password numbers count
    const switchNumbersCount = (value) => {
        handleDispatch("numbersCount", value);
        handleDispatch("preview", []);
    }

    // Password words category
    const onSelectChange = (list) => {
        handleDispatch("preview", []);
        handleDispatch("wordsList", list);
    }

    const passwordWordChange = (e) => {
        handleDispatch("preview", []);
        let lng = e?.target?.value?.length;
        if (lng > 0)
            handleDispatch("wordsList", [e.target.value?.replace(" ", "")]);
    }

    // Generate multiple passwords
    const generatePasswords = () => {

        let usersArray = [];
        let preview = [];

        if(passwordType == "strong"){
            for(let i = 0;i < users?.length; i++){
                var password = GenerateStrongPassword(8);
                usersArray.push({
                    name: users[i].displayname,
                    username: users[i].name,
                    password: password
                })
            }

            handleDispatch("preview", usersArray);
            return;
        }

        if(passwordType === "medium"){

        }

        console.log(preview)
        for (let i = 0; i < users.length; i++) {
            let password = ""
            let broken = false;
            let randomNumber = randomNumbers[numbersCount];

            // if (passwordType !== "strong") {
            //     const randomWord = wordsList.length === 1 ? wordsList[0] : wordsList[Math.floor(Math.random() * wordsList.length)];
            //     password += (randomWord?.name || randomWord);

            //     if (randomNumber === 0)
            //         randomNumber = randomNumbers[8 - password.length];

            //     let min = (randomNumber / 10);

            //     if (!eng.test(password))
            //         password = ReplaceLetters(password);

            //     broken = !eng.test(password);

            //     password += (Math.random() * (randomNumber - min) + min).toFixed(0);
            //     if (passwordLength === 12)
            //         password += symbols[Math.floor(Math.random() * symbols.length)];

            //     password = capitalize(password);
            // } else
            //     password = returnGeneratedPassword();

            // const noExists = usersArray.find(x => x.password === password) === undefined;

            // if (regex.test(password) && !broken && noExists) {
            //     usersArray.push({
            //         username: users[i].name,
            //         password: password
            //     })

            //     preview.push({
            //         displayName: users[i].displayName,
            //         passwordHtml: `<p style='margin-bottom:20px;text-indent:15px'> 
            //                         Lösenord: <span style='color:#c00;font-weight:600;letter-spacing:0.5px'>${password}</span></p>`,
            //         password: password
            //     });
            // } else
            //     i -= 1;
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
                        value={radio.value}
                        control={<Radio />}
                        label={radio.label}
                        onChange={() => onChange(radio.value)} />
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
                                value={radio.value}
                                control={<Radio
                                    color={radio.color} />}
                                label={<Tooltip
                                    title={radio.tips}
                                    classes={{
                                        tooltip: `tooltip-default`
                                    }} arrow>{radio.label}</Tooltip>}
                                onChange={() => handleDispatch("passwordType", radio.value)} />

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
                                        value={radio.value}
                                        control={<Radio
                                            color="info" />}
                                        label={radio.label}
                                        onChange={() => switchCharsLimit(radio.value)} />
                                ))}
                            </RadioGroup>
                        </>}

                    {/* Choice of password category */}
                    {passwordType === "medium" &&
                        <PasswordCategories
                            key={passwordType || limit?.tosTring()}
                            label="Lösenord kategories"
                            limit={limit}
                            multiple={true}
                            disabled={disabled}
                            onChange={onSelectChange} />}

                    {/* Input for password word */}
                    {passwordType === "simple" &&
                        <TextField
                            key={passwordType}
                            label="Ord"
                            className="field-word"
                            placeholder={`Ange ett ord för lösenord ${limit !== isNaN ? ', som är 5–6 tecken långt.' : '.'}`}
                            name="passwordWord"
                            inputProps={{
                                maxLength: limit ? 6 : 16,
                                minLength: 3
                            }}
                            onChange={(e) => passwordWordChange(e)}
                        />}

                    {/* List of password examples */}
                    {(wordsList?.length > 0 && passwordType === "medium" && !limit) &&
                        <div className="last-options">
                            <FormLabel className="radio-label-small">Lösenords alternativ (antal siffror i lösenord)</FormLabel>
                            <RadioGroup
                                row
                                key={passwordType}
                                aria-labelledby="demo-radio-buttons-group-label"
                                defaultValue={3}
                                name="radio-password-length"
                            >
                                {password_digits.map((radio, index) => {
                                    return <FormControlLabel
                                        key={index}
                                        control={<Radio
                                            size='small'
                                            color="info" />}
                                        label={<Tooltip title={`Lösenord med ${radio.value} siffra i slutet`} arrow><span>Password{radio.label}</span></Tooltip>}
                                        name="digits"
                                        onChange={() => switchNumbersCount(radio.value)} />
                                })}
                            </RadioGroup>
                        </div>}
                </div>

                <Button variant="text"
                    color="primary"
                    type="button"
                    size="small"
                    className="generate-password"
                    onClick={generatePasswords}
                    disabled={disabled} >
                    Generera lösenord
                </Button>
            </div>
        </>
    )
}

export default MultiplePassword;
