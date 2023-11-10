import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

// Installed
import axios from 'axios';
import { SearchOffSharp, SearchSharp } from '@mui/icons-material';
import {
    Button, FormControl, FormControlLabel, Tooltip,
    Radio, RadioGroup, TextField, Switch, Autocomplete, Select, MenuItem, InputLabel, Box
} from '@mui/material'

// Components
import Result from './../components/Result'
import ModalHelpTexts from './../components/ModalHelpTexts'// List of all schools in Alvesta municipalities

// Services
import TokenConfig from '../services/TokenConfig';

// Json
import params from './../assets/json/helpTexts.json';
import schools from './../assets/json/schools.json';
import forms from './../assets/json/forms.json';

const source = axios.CancelToken.source();

function Search({ group, updateGroup }) {
    Search.displayName = "Search";

    const sOption = sessionStorage.getItem("sOption");
    const groups = sessionStorage.getItem("groups")?.split(",");
    const defaultData = {
        input: "",
        additionInput: ""
    }
    const choices = [
        { label: "Match", match: true },
        { label: "Exakt", match: false }
    ]
    const [formData, setFormData] = useState(defaultData);
    const [users, setUsers] = useState(JSON.parse(sessionStorage.getItem("users")) || null);
    const [loading, setLoading] = useState(false);
    const [option, setOption] = useState(sOption || "user");
    const [isOpen, setOpen] = useState(false);
    const [clsStudents, setClsStudents] = useState(option === "members");
    const [match, setMatch] = useState(true);
    const [hasNoOptions, setNoOptions] = useState(false);
    const [response, setResponse] = useState(null);
    const [showTips, setTips] = useState(localStorage.getItem("showTips") === "true");

    const history = useHistory();

    useEffect(() => {
        document.title = "UnlockUser | Sök";
        if (history.action === "POP") // Clean the old result if the page is refreshed
            sessionStorage.removeItem("users");

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle a change of text fields and radio input value
    const changeHandler = (e, open) => {
        const inp = e.target;
        if (!inp) return;
        setFormData({ ...formData, [inp.name]: inp.value })
        setNoOptions((open) ? schools.filter(x => x.value.includes(inp.value)).length === 0 : false);
        reset();
    }

    // Return one from help texts found by the keyword
    const returnToolTipByKeyword = (keyword, students) => {
        if (!showTips) return "";
        return (students ? params.studentsList : params.defaultList).find(x => x.label === keyword)?.tip;
    }

    // Handle changes in search alternatives and parameters
    const setSearchParameter = value => {
        setOption(value);
        setMatch(clsStudents);
        setClsStudents(!clsStudents);

        reset();
        resetData();

        //  Save choice of search parameters in sessionStorage to mind the user choice and use it with page refresh
        sessionStorage.setItem("sOption", value)
    }

    // Switch show of tips
    const switchShowTips = () => {
        localStorage.setItem("showTips", !showTips)
        setTips(!showTips);
    }

    // Recognize Enter press to submit search form
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setFormData({ ...formData, [e.target.name]: e.target.value });
            getSearchResult(e);
        }
    }

    // Function - submit form
    const getSearchResult = async (e) => {
        e.preventDefault();

        const { input, additionInput } = formData;

        // Return if form is invalid
        if (input.length < 1)
            return;

        setLoading(true);

        // To authorize
        let _config = TokenConfig();
        _config.cancelToken = source.token;
source.token.reason = null;
        reset();

        // API parameters by chosen searching alternative
        const params = (!clsStudents) ? group + "/" + match : additionInput;

        // API request
        await axios.get("search/" + option + "/" + input + "/" + params, _config).then(res => {
            // Response
            const { users, errorMessage } = res.data;
            setUsers(users || []);
            setLoading(false);
            setFormData({
                ...formData,
                input: users?.length > 0 ? "" : input,
                additionInput: users?.length > 0 ? "" : additionInput,
            })
            setResponse(users ? null : res.data);

            // If something is wrong, view error message in browser console
            if (errorMessage) console.error("Error => " + errorMessage)
        }, error => {
            // Error handle 
            setLoading(false);

            if (error?.response?.status === 401) {
                setResponse({
                    response: {
                        msg: "Åtkomst nekad! Dina atkomstbehörigheter ska kontrolleras på nytt.",
                        alert: "error"
                    }
                })
                setTimeout(() => {
                    history.push("/");
                }, 3000)
            } else if (error.code === "ERR_CANCELED") {
                setResponse({
                    msg: error.message,
                    alert: "warning"
                })
                setTimeout(() => {
                    reset();
                    resetData();
                }, 3000)
            } else
                console.error("Error => " + error.response)
        });
    }

    const reset = () => {
        setUsers(null);
        setResponse(null);

        // Remove result from sessionStorage
        sessionStorage.removeItem("users");
        sessionStorage.removeItem("selectedUsers")
    }

    const resetData = () => {
        setFormData(defaultData);
        setOpen(false);
    }

    const { optionsList, studentsList, defaultList } = params;
    const sFormParams = !clsStudents ? forms?.single : forms?.group;
    const isActive = (formData.input || formData.additionInput).length > 0;
    const arrayTexts = group === "Studenter" ? studentsList.concat(defaultList) : defaultList;

    return (
        <div className='interior-div' onSubmit={getSearchResult}>

            {/* Search form */}
            <div className='d-row search-container'>
                <form className='search-wrapper'>
                    {/* List loop of text fields */}
                    {sFormParams.map((s, index) => (
                        <Autocomplete
                            key={index}
                            freeSolo
                            disableClearable
                            className={s.clsName || 'search-full-width'}
                            options={schools}
                            getOptionLabel={(option) => option.label || ""}
                            autoHighlight
                            open={s.autoOpen && isOpen && !hasNoOptions}
                            inputValue={formData[s.name]}
                            onChange={(e, option) => (e.key === "Enter") ? handleKeyDown : setFormData({ ...formData, [s.name]: option.value })}
                            onBlur={() => setOpen(false)}
                            onClose={() => setOpen(false)}
                            onFocus={() => setOpen(s.autoOpen && !hasNoOptions)}
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
                                        minLength: 2
                                    }}
                                    value={formData[s.name]}
                                    disabled={loading}
                                    placeholder={!match ? s.placeholder : ""}
                                    onKeyDown={handleKeyDown}
                                    onChange={(e) => changeHandler(e, s.autoOpen)}
                                    helperText={formData[s.name].length > 0
                                        ? `${30 - formData[s.name].length} tecken kvar` : "Min 2 & Max 30 tecken"}
                                />}
                        />
                    ))}

                    {/* Submit form - button */}
                    <Button variant={isActive ? "contained" : "outlined"}
                        color={isActive ? "primary" : "inherit"}
                        className="search-button search-button-mobile"
                        type="submit"
                        disabled={!isActive || loading}>
                        <SearchSharp /></Button>

                    {/* Reset form - button */}
                    {isActive && <Button
                        variant="text"
                        color="error"
                        className="search-reset search-button-mobile"
                        disabled={loading}
                        onClick={resetData}>
                        <SearchOffSharp />
                    </Button>}
                </form>

                {/* Choose group */}
                <Box sx={{ minWidth: 160, marginBottom: "9px" }}>
                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">Hanteras</InputLabel>
                        <Select
                            value={group}
                            label="Hanteras"
                            labelId="demo-simple-select-label"
                            onChange={(e) => updateGroup(e.target.value)}
                            sx={{ height: 50, color: "#1976D2" }}
                            disabled={groups.length === 1 || sFormParams.length > 1}
                        >
                            {groups?.map((name, index) => (
                                <MenuItem value={name} key={index}>
                                    <span style={{ marginLeft: "10px" }}> - {name}</span>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </div>


            {/* The search parameters to choice */}
            <div className="checkbox-radio-wrapper d-row" >

                <div className='left-section d-column'>

                    {/* Radio buttons to choice one of search alternatives */}
                    {group === "Studenter" && <FormControl className='checkbox-block-mobile' style={{ display: "inline-block" }}>
                        <RadioGroup row name="row-radio-buttons-group">
                            {/* Loop of radio input choices */}
                            {optionsList?.map((p, index) => (
                                <Tooltip key={index} arrow disableHoverListener={!showTips} title={returnToolTipByKeyword(p.label, true)}
                                    classes={{ tooltip: "tooltip tooltip-green", arrow: "arrow-green" }}>
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
                                <Tooltip key={index} arrow disableHoverListener={!showTips} title={returnToolTipByKeyword(c.label)}
                                    classes={{ tooltip: "tooltip tooltip-blue", arrow: "arrow-blue" }}>
                                    <FormControlLabel
                                        value={c.match}
                                        control={<Radio
                                            size='small'
                                            checked={match === c.match}
                                            disabled={clsStudents} />}
                                        label={c.label}
                                        name="match"
                                        onChange={() => setMatch(c.match)} />
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
                    <ModalHelpTexts arr={arrayTexts} isTitle="Förklaring av sökparametrar" />
                </div>
            </div>

            {/* Result of search */}
            <Result
                list={users}
                clsStudents={clsStudents}
                isVisibleTips={showTips}
                group={group?.toLowerCase()}
                loading={loading}
                response={response}
                resultBlock={true}
                cancelRequest={() => source.cancel("Pågående sökning har avbrutits ...")}
                resetResult={reset}
            />
        </div >
    )
}

export default Search;