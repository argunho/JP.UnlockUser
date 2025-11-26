import { useEffect, use, useReducer, useActionState } from 'react';
import _ from "lodash";

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
import { SearchFields } from '../../models/FormFIelds';


const optionsList = [
    { "label": "Användare", "value": "user" },
    { "label": "Klass elever", "value": "students" }
]

const initialState = {
    option: null,
    isOpen: false,
    isClass: false,
    isMatch: true,
    fields: SearchFields.person,
    hasNoOptions: false,
    showTips: false,
    group: null,
    isChanged: false
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
                option: sessionStorage.getItem("sOption") ?? "user",
                isClass: sessionStorage.getItem("sOption") === "students"
            };
        default:
            return state;
    }
}

function Home() {

    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { option, isOpen, isClass, isMatch, isChanged, fields, hasNoOptions, showTips, group } = state;

    const groups = Claim("groups");

    const { schools, groupName } = useOutletContext();
    const { response, loading, resData: users, fetchData, handleResponse } = use(FetchContext);

    useEffect(() => {
        document.title = "UnlockUser | Sök";
        dispatch({ type: "START" });
    }, []);

    useEffect(() => {
        const currentGroup = groupName ? groups.find(x => x.name.toLowerCase() == groupName)?.name : groups[0]?.name;
        handleDispatch("group", currentGroup);
    }, [groupName])

    function handleDispatch(name, value) {
        dispatch({ type: "PARAM", name: name, payload: value });
    }

    // Handle a change of text fields and radio input value
    const changeHandler = (e, open) => {
        const inp = e.target;
        if (!inp) return;
        handleDispatch("hasNoOptions", (open) ? schools?.filter(x => x?.name.includes(inp.value)).length === 0 : false);
        reset();
    }

    // Handle changes in search alternatives and parameters
    const setSearchParameter = value => {
        handleDispatch("option", value);
        handleDispatch("isMatch", isClass);
        handleDispatch("isClass", !isClass);
        handleDispatch("fields", SearchFields[isClass ? "person" : "students"]);

        //  Save choice of search parameters in sessionStorage to mind the user choice and use it with page refresh
        sessionStorage.setItem("sOption", value)
    }

    // Recognize Enter press to submit search form
    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            onSubmit(e);
        }
    }

    // Function - submit form
    async function onSubmit(previous, fd) {
        let data = {};
        let errors = [];
        let error = null;

        const defFields = fields.map((field) => field.name);
        if (_.isEqual(defFields, fd)) {
            error = "Begäran avvisades. Inga ändringar gjordes i formulärets data."

            return {
                data: defFields,
                error
            }
        }

        // API parameters by chosen searching alternative
        let options = isClass ? "students" : "person";

        defFields?.forEach(field => {
            data[field.name] = fd.get(field.name);
            options += "/" + fd.get(field.name);
        })

        if (errors?.length > 0) {
            return {
                data: data,
                errors: errors
            }
        }

        await fetchData({ api: `search/${options}`, method: "get" });
    }

    function reset() {
        handleDispatch("users", null);
        handleResponse();

        // Remove result from sessionStorage
        sessionStorage.removeItem("users");
        sessionStorage.removeItem("selectedUsers")
    }

    const [formState, formAction, pending] = useActionState(onSubmit, { errors: null });

    return (
        <>
            {/* Search form */}
            <section className='d-row jc-between search-container w-100 ai-start' id="search_container">
                <form key={isClass?.toString()} className='search-wrapper w-100' action={formAction}>
                    {/* List loop of text fields */}
                    {fields?.map((s, index) => (
                        <Autocomplete
                            key={index}
                            freeSolo
                            disableClearable
                            className={s.clsName || 'search-full-width d-row'}
                            options={schools}
                            getOptionLabel={(option) => "- " + option?.primary + " (" + option?.secondary + ")"}
                            autoHighlight
                            open={s.autoOpen && isOpen && !hasNoOptions}
                            // inputValue={formData[s.name]}
                            // onChange={(e, option) => (e.key === "Enter") ? handleKeyDown : handleDispatch("formData", { ...formData, [s.name]: option.primary })}
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

                                            {/* Checkbox and radio with search parameters to choose for user search */}
                                            <FormControlLabel
                                                control={<Checkbox
                                                    size='small'
                                                    name="match"
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

                                            {/* Reset form - button */}
                                            {isChanged &&
                                                <Button
                                                    variant="text"
                                                    color="error"
                                                    className="search-reset search-button-mobile"
                                                    disabled={loading}>
                                                    {/* onClick={resetData} */}
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
                                    // value={formData[s.name]}
                                    disabled={loading}
                                    placeholder={isMatch ? s.placeholder : "Sök ord här ..."}
                                    onKeyDown={handleKeyDown}
                                    onChange={(e) => changeHandler(e, s.autoOpen)}
                                // helperText={formData[s.name].length > 0 ? `${30 - formData[s.name].length} tecken kvar` : "Min 2 & Max 30 tecken"}
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
                    disabled={groups?.length === 1 || fields?.length > 1} />}
            </section>

            {/* The search parameters to choice */}
            <section className="checkbox-radio-wrapper d-row jc-between w-100" id="crw">

                <div className='left-section d-row ai-start'>


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
            <Result
                list={users}
                clsStudents={isClass}
                isVisibleTips={showTips}
                loading={loading}
                response={response}
                disabled={group == "Support"}
                resultBlock={true}
            // resetResult={resetData}
            />
        </>
    )
}

export default Home;