import { useReducer } from 'react';

// Installed
import { FormControlLabel, Radio, FormLabel, Tooltip, RadioGroup, Button } from "@mui/material";
import { TextField } from '@mui/material';

// Components
import ListCategories from './../lists/ListCategories';


const initialState = {
    samePassword: false,
    wordsList: [],
    numbersCount: 0,
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
        default:
            return state;
    }
}

const radios = [
    { label: "Samma lösenord", value: true },
    { label: "Olika lösenord", value: false }
];

const radio_group = [
    { label: "Komplicerad", tips: "Genererad av slumpmässiga tecken", color: "error", value: "strong" },
    { label: "Lagom", tips: "Olika ord & siffror", color: "primary", value: "medium" },
    { label: "Enkelt", tips: "Ett liknande ord för alla lösenord med olika siffror.", color: "success", value: "simple" }
];

const radio_digits = [
    { label: "Total 8 tecken", value: true },
    { label: "Från 8 tecken", value: false }
]

function MultiplePassword({ selected, onSwitch }) {
    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { samePassword, wordsList, numbersCount, passType: passwordType, limitedChars } = state;


    // // To manipulate elements like js getElementById
    // const refModal = useRef(null);

    function onChange(value) {
        handleDispatch("samePassword", value);
        setTimeout(() => {
            onSwitch(value)
        }, value ? 1000 : 0)
    }

    function handleDispatch(name, value) {
        dispatch({ type: "PARAM", name: name, payload: value });
    }

    // Set limited chars
    const switchCharsLimit = (value) => {
        handleDispatch("limitedChars", value);

        if (wordsList.length > 0)
            handleDispatch("wordsList", []);
        if (selected.length > 0)
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


    const setPreviewList = (previewList) => {
        updatePreviewList(previewList);
    }


    // Generate multiple passwords
    const generatePasswords = () => {

        let usersArray = [];
        let previewList = [];
        for (let i = 0; i < users.length; i++) {
            let password = ""
            let broken = false;
            let randomNumber = randomNumbers[numbersCount];

            if (!strongPassword) {
                const randomWord = wordsList.length === 1 ? wordsList[0] : wordsList[Math.floor(Math.random() * wordsList.length)];
                password += (randomWord?.name || randomWord);

                if (randomNumber === 0)
                    randomNumber = randomNumbers[8 - password.length];

                let min = (randomNumber / 10);

                if (!eng.test(password))
                    password = ReplaceLetters(password);

                broken = !eng.test(password);

                password += (Math.random() * (randomNumber - min) + min).toFixed(0);
                if (passwordLength === 12)
                    password += symbols[Math.floor(Math.random() * symbols.length)];

                password = capitalize(password);
            } else
                password = returnGeneratedPassword();

            const noExists = usersArray.find(x => x.password === password) === undefined;

            if (regex.test(password) && !broken && noExists) {
                usersArray.push({
                    username: users[i].name,
                    password: password
                })

                previewList.push({
                    displayName: users[i].displayName,
                    passwordHtml: `<p style='margin-bottom:20px;text-indent:15px'> 
                                    Lösenord: <span style='color:#c00;font-weight:600;letter-spacing:0.5px'>${password}</span></p>`,
                    password: password
                });
            } else
                i -= 1;
        }

        setPassword({ users: usersArray });
        setPreviewList(previewList);
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
                {radios.map((radio, index) => (
                    <FormControlLabel
                        key={index}
                        value={radio.value}
                        control={<Radio size='small' />}
                        label={radio.label}
                        onChange={() => onChange(radio.value)} />
                ))}
            </RadioGroup>

            {/* Different alternatives for password generation */}
            <div className={`dropdown-container w-100${(!samePassword ? " open" : "")}`}>
                <div className='dropdown-wrapper'>

                    {/* Loop of radio input choices to choose password type strong or not */}
                    <FormLabel className="label">Lösenordstyp</FormLabel>
                    <RadioGroup
                        row
                        aria-labelledby="demo-radio-buttons-group-label"
                        defaultValue="strong"
                        name="radio-password-type"
                    >
                        {radio_group.map((radio, index) => (

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
                                onChange={() => handleDispatch("passType", radio.value)} />

                        ))}
                    </RadioGroup>


                    {/* Choice of password length */}
                    {["medium", "simple"].includes(passwordType) &&
                        <>
                            <FormLabel className="label-small" >Lösenords längd</FormLabel>
                            <RadioGroup
                                row
                                aria-labelledby="demo-radio-buttons-group-label"
                                defaultValue="strong"
                                name="radio-password-length"
                            >
                                {radio_digits.map((radio, index) => (
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
                        <ListCategories
                            limitedChars={limitedChars}
                            label="Lösenords kategory"
                            selectChange={(list) => handleSelectListChange(list)}
                            multiple={true}
                        />}

                    {/* Input for password word */}
                    {passwordType === "simple" &&
                        <TextField
                            label="Ord"
                            sx={{ width: 350, marginTop: "15px" }}
                            placeholder={`Ditt ord för lösenord ${limitedChars ? ', från 5 upp till 6 tecken lång' : ''}`}
                            value={wordsList[0]}
                            name="passwordWord"
                            inputProps={{
                                maxLength: limitedChars ? 6 : 16,
                                minLength: 3
                            }}
                            onChange={(e) => passwordWordChange(e)}
                        />}

                    {/* List of password examples */}
                    {(wordsList.length > 0 && passwordType === "medium" && !limitedChars) &&
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

                <Button variant="text"
                    color="primary"
                    type="button"
                    size="small"
                    className="generate-password"
                    onClick={generatePasswords}
                    disabled={disabledTooltip || disabledClick}
                    ref={ref}>
                    Generera {regenerate && " andra"} lösenord
                </Button>
            </div>
        </>
    )
}

export default MultiplePassword;
