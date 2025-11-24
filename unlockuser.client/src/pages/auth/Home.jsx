import { useEffect, use, useReducer } from 'react';

// Installed
import { SearchOffSharp, SearchSharp } from '@mui/icons-material';
import {
    Button, FormControl, FormControlLabel, Tooltip,
    Radio, RadioGroup, TextField, Switch, Autocomplete, Checkbox
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';

// Components
import Result from '../../components/Result';
import ModalView from '../../components/modals/ModalView';
import DropdownMenu from '../../components/lists/DropdownMenu';

// Functions
import { Claim } from '../../functions/DecodedToken';

// Storage
import { FetchContext } from '../../storage/FetchContext';

// Models
import { AllTips, Tips } from '../../models/HelpTexts';
import { Colors } from '../../models/Colors';

// Json
import forms from '../../assets/json/forms.json';

const defaultData = {
    input: "",
    additionInput: ""
}

const optionsList = [
    { "label": "Användare", "value": "user" },
    { "label": "Klass elever", "value": "students" }
]

const initialState = {
    formData: defaultData,
    users: [],
    option: null,
    isOpen: false,
    isClass: false,
    isMatch: true,
    hasNoOptions: false,
    showTips: false,
    group: null
}

// Action reducer
function actionReducer(state, action) {
    const obj = action.payload ? action.payload : null;
    switch (action.type) {
        case "PARAM":
            return {
                ...state, [action.name]: obj
            };
        case "START":
            return {
                ...state,
                users: sessionStorage.getItem("users") ? JSON.parse(sessionStorage.getItem("users")) : [],
                option: sessionStorage.getItem("sOption") ?? "user",
                isClass: sessionStorage.getItem("sOption") === "students"
            };
        default:
            return state;
    }
}

function Home() {

    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { formData, users, option, isOpen, isClass, isMatch, hasNoOptions, showTips, group } = state;

    const groups = Claim("groups");

    const sFormParams = !isClass ? forms?.single : forms?.group;
    const isActive = (formData.input || formData.additionInput).length > 0;

    const { schools, groupName } = useOutletContext();
    const { response, loading, fetchData, handleResponse } = use(FetchContext);

    useEffect(() => {
        document.title = "UnlockUser | Sök";
        dispatch({ type: "START" });
    }, []);

    useEffect(() => {
        const currentGroup = groupName ? groups.find(x => x.name.toLowerCase() == groupName)?.name : groups[0]?.name;
        handleDispatch("users", []);
        handleDispatch("group", currentGroup);
    }, [groupName])

    function handleDispatch(name, value) {
        console.log(name, value)
        dispatch({ type: "PARAM", name: name, payload: value });
    }

    // Handle a change of text fields and radio input value
    const changeHandler = (e, open) => {
        const inp = e.target;
        if (!inp) return;
        handleDispatch("formData", { ...formData, [inp.name]: inp.value })
        handleDispatch("hasNoOptions", (open) ? schools?.filter(x => x?.name.includes(inp.value)).length === 0 : false);
        reset();
    }

    // Handle changes in search alternatives and parameters
    const setSearchParameter = value => {
        handleDispatch("option", value);
        handleDispatch("isMatch", isClass);
        handleDispatch("isClass", !isClass);
        reset();
        resetData();

        //  Save choice of search parameters in sessionStorage to mind the user choice and use it with page refresh
        sessionStorage.setItem("sOption", value)
    }

    // Recognize Enter press to submit search form
    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            handleDispatch("formData", { ...formData, [e.target.name]: e.target.value });
            getSearchResult(e);
        }
    }

    // Function - submit form
    async function getSearchResult(e) {
        e.preventDefault();

        const { input, additionInput } = formData;

        // Return if form is invalid
        if (input.length < 1)
            return;

        reset();

        // API parameters by chosen searching alternative
        const params = (!isClass) ? group + "/" + isMatch : additionInput;

        const { users } = await fetchData({ api: "search/" + option + "/" + input + "/" + params, method: "get", action: "return" });
        handleDispatch("users", users);
        handleDispatch("formData", {
            ...formData,
            input: users?.length > 0 ? "" : input,
            additionInput: users?.length > 0 ? "" : additionInput,
        })
    }

    function reset() {
        handleDispatch("users", null);
        handleResponse();

        // Remove result from sessionStorage
        sessionStorage.removeItem("users");
        sessionStorage.removeItem("selectedUsers")
    }

    function resetData() {
        reset();
        handleDispatch("formData", defaultData);
        handleDispatch("isOpen", false);
    }


    return (
        <div className='interior-div'>

            {/* Search form */}
            <section className='d-row jc-between search-container ai-start' id="search_container">
                <form className='search-wrapper w-100' onSubmit={getSearchResult}>
                    {/* List loop of text fields */}
                    {sFormParams?.map((s, index) => (
                        <Autocomplete
                            key={index}
                            freeSolo
                            disableClearable
                            className={s.clsName || 'search-full-width d-row'}
                            options={schools}
                            getOptionLabel={(option) => "- " + option?.primary + " (" + option?.secondary + ")"}
                            autoHighlight
                            open={s.autoOpen && isOpen && !hasNoOptions}
                            inputValue={formData[s.name]}
                            onChange={(e, option) => (e.key === "Enter") ? handleKeyDown : handleDispatch("formData", { ...formData, [s.name]: option.primary })}
                            onBlur={() => handleDispatch("isOpen", false)}
                            onClose={() => handleDispatch("isOpen", false)}
                            onFocus={() => handleDispatch("isOpen", s.autoOpen && !hasNoOptions)}
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    name={s.name}
                                    label={s.label}
                                    error={response?.warning || false}
                                    required
                                    InputProps={{
                                        ...params.InputProps,
                                        maxLength: 30,
                                        minLength: 2,
                                        endAdornment: (isClass && index == 0) ? null : <div className="d-row">
                                            {/* Reset form - button */}
                                            {isActive &&
                                                <Button
                                                    variant="text"
                                                    color="error"
                                                    className="search-reset search-button-mobile"
                                                    disabled={loading}
                                                    onClick={resetData}>
                                                    <SearchOffSharp />
                                                </Button>}

                                            {/* Submit form - button */}
                                            <Button variant={isActive ? "contained" : "outlined"}
                                                color={isActive ? "primary" : "inherit"}
                                                className="search-button search-button-mobile"
                                                type="submit"
                                                disabled={!isActive || loading}>
                                                <SearchSharp /></Button>
                                        </div>
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    value={formData[s.name]}
                                    disabled={loading}
                                    placeholder={isMatch ? s.placeholder : "Sök ord här ..."}
                                    onKeyDown={handleKeyDown}
                                    onChange={(e) => changeHandler(e, s.autoOpen)}
                                    helperText={formData[s.name].length > 0 ? `${30 - formData[s.name].length} tecken kvar` : "Min 2 & Max 30 tecken"}
                                />}
                        />
                    ))}
                </form>

                {/* Choose group */}
                {groups?.length > 0 && <DropdownMenu
                    label="Hanteras"
                    list={groups}
                    value={group}
                    link="/search/"
                    disabled={groups?.length === 1 || sFormParams?.length > 1} />}
            </section>

            {/* The search parameters to choice */}
            <section className="checkbox-radio-wrapper d-row jc-between" id="crw">

                <div className='left-section d-row ai-start'>

                    {/* Checkbox and radio with search parameters to choose for user search */}
                    <FormControlLabel
                        control={<Checkbox
                                size='small'
                                disabled={isClass}
                                checked={isMatch}
                                onClick={() => handleDispatch("isMatch", !isMatch)} />}
                        label={<Tooltip
                            disableHoverListener={!showTips}
                            title={Tips.find(x => x.value === "match")?.secondary}
                            classes={{
                                tooltip: "tooltip-default"
                            }}
                            PopperProps={{
                                sx: {
                                    '& .MuiTooltip-tooltip': {
                                        backgroundColor: Colors["primary"]
                                    },
                                    '& .MuiTooltip-arrow': {
                                        color: Colors["primary"]
                                    }
                                }
                            }}
                            arrow>Exact match</Tooltip>} />

                    {/* Radio buttons to choice one of search alternatives */}
                    {group === "Studenter" && <FormControl className='checkbox-block-mobile'>
                        <RadioGroup row name="row-radio-buttons-group">
                            {/* Loop of radio input choices */}
                            {optionsList?.map((p, index) => (
                                <Tooltip
                                    key={index}
                                    disableHoverListener={!showTips}
                                    title={AllTips.find(x => x.value === p.value)?.secondary}
                                    classes={{
                                        tooltip: "tooltip-default"
                                    }}
                                    PopperProps={{
                                        sx: {
                                            '& .MuiTooltip-tooltip': {
                                                backgroundColor: Colors["success"]
                                            },
                                            '& .MuiTooltip-arrow': {
                                                color: Colors["success"]
                                            }
                                        }
                                    }}
                                    arrow>
                                    <FormControlLabel
                                        value={option === p.value}
                                        control={<Radio
                                            size='small'
                                            checked={option === p.value}
                                            color="success" />}
                                        label={p.label}
                                        name="sOption"
                                        onChange={() => setSearchParameter(p.value)} />
                                </Tooltip>
                            ))}
                        </RadioGroup>
                    </FormControl>}
                </div>

                <div className='right-section d-row'>
                    {/* Switchable box */}
                    <FormControlLabel
                        className='switch-btn'
                        control={<Switch
                            checked={showTips}
                            color='info'
                            onChange={() => handleDispatch("showTips", !showTips)} />}
                        label="Tips" />

                    {/* Modal  window with help texts */}
                    <ModalView
                        label="Förklaring av sökparametrar"
                        content={group === "Studenter" ? AllTips : Tips} />
                </div>
            </section >

            {/* Result of search */}
            < Result
                list={users}
                clsStudents={isClass}
                isVisibleTips={showTips}
                loading={loading}
                response={response}
                disabled={group == "Support"
                }
                resultBlock={true}
                // cancelRequest={CancelRequest}
                resetResult={resetData}
            />
        </div >
    )
}

export default Home;