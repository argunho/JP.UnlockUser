import { useEffect, use, useReducer } from 'react';

// Installed
import { SearchOffSharp, SearchSharp } from '@mui/icons-material';
import {
    Button, FormControl, FormControlLabel, Tooltip,
    Radio, RadioGroup, TextField, Switch, Autocomplete, Select, MenuItem, InputLabel
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';


// Components
import Result from '../../components/Result';
import ModalHelpTexts from '../../components/modals/ModalHelpTexts';


// Storage
import { AuthContext } from '../../storage/AuthContext';
import { FetchContext } from '../../storage/FetchContext';

// Json
import params from '../../assets/json/helpTexts.json';
import forms from '../../assets/json/forms.json';
import ModalView from '../../components/modals/ModalView';
const defaultData = {
    input: "",
    additionInput: ""
}

const choices = [
    { label: "Match", match: true },
    { label: "Exakt", match: false }
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
                ...state, users: sessionStorage.getItem("users") ? JSON.parse(sessionStorage.getItem("users")) : [],
                option: sessionStorage.getItem("sOption") ?? "user", isClass: sessionStorage.getItem("sOption") === "students",
                showTips: localStorage.getItem("showTips") === "true", [action.name]: obj
            };
        default:
            return state;
    }
}

function Home() {

    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { formData, users, option, isOpen, isClass, isMatch, hasNoOptions, showTips, group } = state;
    const { groups, group: currentGroup, updateGroupName } = use(AuthContext);

    const { optionsList, studentsList, defaultList } = params;
    const sFormParams = !isClass ? forms?.single : forms?.group;
    const isActive = (formData.input || formData.additionInput).length > 0;
    const arrayTexts = group === "Studenter" ? studentsList.concat(defaultList) : defaultList;

    const { schools } = useOutletContext();
    const { response, loading, fetchData, handleResponse } = use(FetchContext);

    useEffect(() => {
        document.title = "UnlockUser | Sök";

        dispatch({ type: "START", name: "group", payload: currentGroup });
    }, []);

    useEffect(() => {
        handleDispatch("users", []);
    }, [currentGroup])

    function handleDispatch(name, value) {
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

    // Return one from help texts found by the keyword
    const returnToolTipByKeyword = (keyword, students) => {
        if (!showTips) return "";
        return (students ? params.studentsList : params.defaultList).find(x => x.label === keyword)?.tip;
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

    // Switch show of tips
    const switchShowTips = () => {
        localStorage.setItem("showTips", !showTips)
        handleDispatch("showTips", !showTips);
    }

    function switchGroup(e) {
        const value = e.target.value;
        sessionStorage.setItem("group", value);
        updateGroupName(value);
        handleDispatch("group", value);
        reset();
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
                                    placeholder={!isMatch ? s.placeholder : "Sök ord här ..."}
                                    onKeyDown={handleKeyDown}
                                    onChange={(e) => changeHandler(e, s.autoOpen)}
                                    helperText={formData[s.name].length > 0 ? `${30 - formData[s.name].length} tecken kvar` : "Min 2 & Max 30 tecken"}
                                />}
                        />
                    ))}

                </form>

                {/* Choose group */}
                {groups?.length > 1 &&
                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label" shrink>Hanteras</InputLabel>
                        <Select
                            displayEmpty
                            value={group ?? ""}
                            label="Hanteras"
                            labelId="demo-simple-select-label"
                            onChange={switchGroup}
                            sx={{ color: "#1976D2" }}
                            disabled={groups?.length === 1 || sFormParams?.length > 1}
                        >
                            {groups?.map((group, index) => (
                                <MenuItem value={group?.name} key={index}>
                                    <span style={{ marginLeft: "10px" }}> - {group?.name}</span>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>}
            </section>

            {/* The search parameters to choice */}
            <section className="checkbox-radio-wrapper d-row jc-between" id="crw">

                <div className='left-section d-column ai-start'>

                    {/* Radio buttons to choice one of search alternatives */}
                    {group === "Studenter" && <FormControl className='checkbox-block-mobile' style={{ display: "inline-block" }}>
                        <RadioGroup row name="row-radio-buttons-group">
                            {/* Loop of radio input choices */}
                            {optionsList?.map((p, index) => (
                                <Tooltip key={index} disableHoverListener={!showTips} title={returnToolTipByKeyword(p.label, true)}
                                    classes={{ tooltip: "tooltip tooltip-green", arrow: "arrow-green" }} arrow>
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

                    {/* Checkbox and radio with search parameters to choose for user search */}
                    <FormControl style={{ display: "block" }}>
                        <RadioGroup row name="row-radio-buttons-group">
                            {/* Loop of radio input choices */}
                            {choices.map((c, index) => (
                                <Tooltip key={index} disableHoverListener={!showTips} title={returnToolTipByKeyword(c.label)}
                                    classes={{ tooltip: "tooltip tooltip-blue", arrow: "arrow-blue" }} arrow>
                                    <FormControlLabel
                                        value={c.match}
                                        control={<Radio
                                            size='small'
                                            checked={isMatch === c.match}
                                            disabled={isClass} />}
                                        label={c.label}
                                        name="match"
                                        onChange={() => handleDispatch("isMatch", c.match)} />
                                </Tooltip>
                            ))}
                        </RadioGroup>
                    </FormControl>
                </div>

                <div className='right-section d-row'>
                    {/* Switchable box */}
                    <FormControlLabel className='switch-btn'
                        control={<Switch checked={showTips} color='info'
                            onChange={switchShowTips} />} label="Tips" />

                    {/* Modal  window with help texts */}
                    <ModalView data={arrayTexts} label="Förklaring av sökparametrar" />
                </div>
            </section>

            {/* Result of search */}
            <Result
                list={users}
                clsStudents={isClass}
                isVisibleTips={showTips}
                loading={loading}
                response={response}
                disabled={group == "Support"}
                resultBlock={true}
                // cancelRequest={CancelRequest}
                resetResult={resetData}
            />
        </div >
    )
}

export default Home;