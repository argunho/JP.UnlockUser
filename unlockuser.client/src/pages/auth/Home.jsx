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
    isClass: false,
    isMatch: true,
    hasNoOptions: false,
    showTips: false,
    group: null,
    isChanged: false
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
        default:
            return state;
    }
}

// Css
import './../../assets/css/home.css'

function Home() {

    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { isClass, isMatch, isChanged, showTips, group } = state;

    const groups = Claim("groups");

    const { schools, groupName } = useOutletContext();
    const { response, loading, resData: users, fetchData, handleResponse } = use(FetchContext);
    const ref = useRef(null);

    useEffect(() => {
        document.title = "UnlockUser | Sök";
    }, []);

    useEffect(() => {
        const currentGroup = groupName ? groups.find(x => x.name.toLowerCase() == groupName) : groups[0];
        handleDispatch("group", currentGroup, "START");
    }, [groupName])

    function handleDispatch(name, value, type = "PARAM" ) {
        dispatch({ type: type, name: name, payload: value });
    }

    // Recognize Enter press to submit search form
    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            onSubmit(e);
        }
    }

    function onChange(e) {
        console.log(e.target)
    }

    // Function - submit form
    async function onSubmit(previous, fd) {
        let data = {
            name: ""
        };
        if (isClass)
            data.school = "";

        let errors = [];
        let error = null;

        if (_.isEqual(data, fd)) {
            error = "Begäran avvisades. Inga ändringar gjordes i formulärets data."

            return {
                data,
                error
            }
        }

        // API parameters by chosen searching alternative
        let options = isClass ? `students${fd.get("school")}/${fd.get("name")}`
            : `person/${fd.get("name")}/${group?.manage}/${fd.get("match")}`;

        if (errors?.length > 0) {
            return {
                data: data,
                errors: errors
            }
        }

        await fetchData({ api: `search/${options}`, method: "get" });
    }

    const [formState, formAction, pending] = useActionState(onSubmit, { errors: null });

    return (
        <>
            {/* Search form */}
            <form key={isClass?.toString()} className='d-row search-form w-100' action={formAction}>

                {/* collections lust to choose */}
                {isClass && <AutocompleteList
                    label="Skolnamn"
                    name="school"
                    collection={schools}
                    required={true}
                    shrink={true}
                    disabled={loading}
                    placeholder="Skriv exakt skolnamn här .." />}

                {/* Field name */}
                <TextField
                    name="name"
                    label={isClass ? "Klassbeteckning" : "Namn"}
                    variant="outlined"
                    required
                    fullWidth
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
                                edge="end">
                                <SearchOffSharp />
                            </Button>

                            {/* Submit form - button */}
                            <Button variant={isChanged ? "contained" : "outlined"}
                                color={isChanged ? "primary" : "inherit"}
                                className="search-button"
                                type="submit"
                                disabled={!isChanged || loading}
                                ref={ref}
                                edge="end">
                                <SearchSharp /></Button>
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
                                        onChange={() => handleDispatch("isClass", !isClass)} />
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
                clsStudents={isClass}
                isVisibleTips={showTips}
                loading={loading}
                response={response}
                disabled={group?.name === "Support"}
                resultBlock={true}
            />
        </>
    )
}

export default Home;