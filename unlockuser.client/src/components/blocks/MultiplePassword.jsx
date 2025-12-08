import { useReducer } from 'react';

// Installed
import { FormControlLabel, Radio, FormLabel, Tooltip, } from "@mui/material";
import { TextField } from '@mui/material';
import { FormControl } from '@mui/material';

// Components
import ListCategories from './../lists/ListCategories';


const initialState = {
    variousPassword: false,
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

function MultiplePassword({ selected, resetForm }) {
    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { variousPassword, wordsList, numbersCount, passType, limitedChars } = state;

    
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

    return (
        <>
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
        </>
    )
}

export default MultiplePassword;
