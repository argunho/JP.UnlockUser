import { useEffect, use, useReducer, useRef, useActionState } from 'react';
import _ from "lodash";

// Installed
import { SearchOffSharp, SearchSharp } from '@mui/icons-material';
import {
    Button, FormControl, FormControlLabel, Tooltip,
    Radio, RadioGroup, TextField, Switch, Checkbox, InputAdornment
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';

// Components
import ModalView from '../../components/modals/ModalView';
import DropdownMenu from '../../components/lists/DropdownMenu';
import AutocompleteList from './../../components/lists/AutocompleteList';
import ResultView from '../../components/blocks/ResultView';

// Functions
import { Claim } from '../../functions/DecodedToken';

// Storage
import { FetchContext } from '../../storage/FetchContext';

// Models
import { AllTips, Tips } from '../../models/HelpTexts';
import { Colors } from '../../models/Colors';


const radioChoices = [
    { label: "Användare", value: "user" },
    { label: "Klass elever", value: "students" }
]

const initialState = {
    showTips: false,
    group: [],
    users: null,
    isClass: false,
    isMatch: true,
    isChanged: false,
    isErased: null
}

// Action reducer
function actionReducer(state, action) {
    const value = action.payload ? action.payload : null;
    switch (action.type) {
        case "PARAM":
            return {
                ...state, [action.name]: value
            };
        case "START":
            return {
                ...state,
                [action.name]: value,
                isClass: false
            };
        case "SEARCH_OPTION":
            return {
                ...state,
                [action.name]: value,
                isChanged: value
            };
        case "RESULT":
            return {
                ...state,
                [action.name]: value,
                isChanged: false
            };
        case "RESET":
            return {
                ...state,
                isClass: false,
                isChanged: false,
                users: null,
                isMatch: false,
                isErased: new Date().getMilliseconds()
            };
        default:
            return state;
    }
}

// Css
import './../../assets/css/home.css'

function Home() {

    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { isClass, isMatch, isChanged, isErased, users, group, showTips } = state;

    const groups = Claim("groups");

    const { dashboardData, schools, groupName } = useOutletContext();
    const { collections, updateSessionData, sessionData } = dashboardData;
    const { response, pending: loading, fetchData, handleResponse } = use(FetchContext);
    const refSubmit = useRef(null);
    const refAutocomplete = useRef(null);

    useEffect(() => {
        document.title = "UnlockUser | Sök";
        if(response)
            handleResponse();
        if (sessionData["users"])
            handleDispatch("users", sessionData["users"]);
    }, []);

    useEffect(() => {
        const currentGroup = groupName ? groups.find(x => x.name.toLowerCase() == groupName) : groups[0];
        handleDispatch("group", currentGroup, "START");
        onReset();
    }, [groupName])

    function handleDispatch(name, value, type = "PARAM") {
        dispatch({ type: type, name: name, payload: value });
    }

    // Recognize Enter press to submit search form
    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            onSubmit(e);
        }
    }

    function onChange(e) {
        const value = e.target.value;
        if ((!isChanged && value?.length < 2)
            || (isChanged && value?.length > 2)
            || (isClass && !refAutocomplete?.current))
            return;

        handleDispatch("isChanged", !isChanged);
    }

    // Function - submit form
    async function onSubmit(previous, fd) {
        onReset();
        let data = {
            name: ""
        };
        if (isClass)
            data.school = "";

        let errors = [];
        let error = null;

        handleDispatch("isChanged", false);

        if (_.isEqual(data, fd)) {
            error = "Begäran avvisades. Inga ändringar gjordes i formulärets data."

            return {
                data,
                error
            }
        }

        if (errors?.length > 0) {
            return {
                data: data,
                errors: errors
            }
        }

        const name = fd.get("name")?.toLowerCase();
        const match = fd.get("match") === "on" ? true : false;
        const gn = group.name?.toLowerCase()
        const collection = (gn === "support" ? groups.flatMap(g => collections[g.name.toLowerCase()]) : collections[gn]).filter(Boolean);


        console.log(collection)
        if (collection?.length > 0) {
            const result = (isClass)
                ? collection?.filter(x => x?.department?.toLowerCase() === name && x?.office === fd.get("school"))
                : collection?.filter(x => match ? x?.displayName?.toLowerCase() === name : x?.displayName?.toLowerCase().includes(name));
            handleDispatch("users", result, "RESULT");

            if (result?.length > 0)
                updateSessionData("users", result);

            return null;
        }

        // API parameters by chosen searching alternative
        let options = isClass ? `students${fd.get("school")}/${name}` : `person/${name}/${group?.name}/${match}`;

        const res = await fetchData({ api: `search/${options}`, method: "get", action: "return" });
        if (Array.isArray(res))
            handleDispatch("users", res, "RESULT");
    }

    function onReset() {
        if (response)
            handleResponse();
        else {
            dispatch({ type: "RESET" });
            updateSessionData("users", null);
        }
    }

    const [formState, formAction, pending] = useActionState(onSubmit, { errors: null });

    return (
        <>
            {/* Search form */}
            <form key={isErased} className='d-row search-form w-100' action={formAction}>

                {/* collections lust to choose */}
                {isClass && <AutocompleteList
                    label="Skolnamn"
                    name="school"
                    collection={schools}
                    required={true}
                    shrink={true}
                    disabled={loading}
                    defValue={formState?.school}
                    keyword="id"
                    placeholder="Skriv exakt skolnamn här .."
                    ref={refAutocomplete}
                />}

                {/* Field name */}
                <TextField
                    name="name"
                    label={isClass ? "Klassbeteckning" : "Namn"}
                    variant="outlined"
                    required
                    fullWidth
                    value={formState?.name}
                    className="search-wrapper w-100"
                    InputProps={{
                        maxLength: 30,
                        minLength: 2,
                        endAdornment: <InputAdornment position="end">
                            {/* Checkbox and radio with search parameters to choose for user search */}
                            {!isClass && <FormControlLabel
                                control={<Checkbox
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
                                    arrow>Exact match</Tooltip>} />}

                            {/* Reset form - button */}
                            <Button
                                color="error"
                                className="search-reset"
                                type="reset"
                                disabled={loading || !isChanged}
                                onClick={() => dispatch({ type: "RESET" })}
                                edge="end">
                                <SearchOffSharp />
                            </Button>

                            {/* Submit form - button */}
                            <Button variant={isChanged ? "contained" : "outlined"}
                                color={isChanged ? "primary" : "inherit"}
                                className="search-button"
                                type="submit"
                                disabled={!isChanged || loading}
                                ref={refSubmit}
                                edge="end">
                                <SearchSharp />
                            </Button>
                        </InputAdornment>
                    }}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                    placeholder={isClass ? "Skriv exakt klassbeteckning här ..." : (isMatch ? "Skriv exakt fullständigt namn eller anvädarnamn här ..." : "Sök ord här ...")}
                    onKeyDown={handleKeyDown}
                    onChange={onChange}
                />

                {/* Choose group */}
                {groups?.length > 1 && <DropdownMenu
                    label="Hanteras"
                    list={groups}
                    value={group ? group?.name : ""}
                    link="/search/"
                    disabled={groups?.length === 1} />}
            </form>

            {/* The search parameters to choice */}
            <section className="actions-wrapper d-row jc-between w-100" id="crw">

                <div className='left-section d-row ai-start'>
                    {/* Radio buttons to choice one of search alternatives */}
                    {group?.name === "Studenter" && <FormControl className='checkbox-block-mobile'>
                        <RadioGroup row name="row-radio-buttons-group">
                            {/* Loop of radio input choices */}
                            {radioChoices?.map((p, index) => (
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
                                        control={<Radio
                                            size='small'
                                            checked={p.value === "user" ? !isClass : isClass}
                                            color="success" />}
                                        label={p.label}
                                        onChange={() => handleDispatch("isClass", !isClass, "SEARCH_OPTION")} />
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
                        content={group?.name === "Studenter" ? AllTips : Tips} />
                </div>
            </section>

            {/* Result of search */}
            <ResultView
                list={users}
                isClass={isClass}
                loading={pending || loading}
                disabled={group?.name === "Support"}
                resultBlock={true}
                onReset={onReset}
            />
        </>
    )
}

export default Home;