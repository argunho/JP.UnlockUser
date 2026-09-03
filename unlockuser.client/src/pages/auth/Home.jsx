import { useEffect, use, useReducer, useRef, useActionState } from 'react';
import _ from "lodash";

// Installed
import { SearchOffSharp, SearchSharp, Close, List } from '@mui/icons-material';
import {
    Button, FormControl, FormControlLabel, Tooltip, IconButton,
    Radio, RadioGroup, TextField, Checkbox, InputAdornment
} from '@mui/material';
import { useOutletContext, NavLink, useNavigate, useLocation } from 'react-router-dom'; //, useSearchParams

// Components
import ModalView from '../../components/modals/ModalView';
import DropdownMenu from '../../components/lists/DropdownMenu';
import AutocompleteList from './../../components/lists/AutocompleteList';
import ListLoading from './../../components/lists/ListLoading';
import ListsView from './../../components/lists/ListsView';
import Message from '../../components/blocks/Message';

// Functions
import { Claim } from '../../functions/DecodedToken';

// Storage
import { FetchContext } from '../../storage/FetchContext';

// Models
import { AllTips, Tips } from '../../models/HelpTexts';

const radioChoices = [
    { label: "Användare", value: "user" },
    { label: "Klass elever", value: "students" }
]

const initialState = {
    group: "",
    users: null,
    isClass: false,
    isMatch: false,
    isChanged: false,
    byOffice: false,
    isCleaned: null,
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
                ...state, [action.name]: value, isClass: false
            };
        case "SEARCH_OPTION":
            return {
                ...state, [action.name]: value, isChanged: value, users: null
            };
        case "RESULT":
            return {
                ...state, [action.name]: value, isChanged: false, isCleaned: new Date().getMilliseconds()
            };
        case "RESET":
            return {
                ...state, isChanged: false, users: null, isMatch: false, byOffice: false, isCleaned: new Date().getMilliseconds()
            };
        default:
            return state;
    }
}

// Css
import './../../assets/css/home.css';
import { LinearProgress } from '@mui/material';


function Home() {

    const [state, dispatch] = useReducer(actionReducer, initialState);
    const { isClass, isMatch, isChanged, isCleaned, byOffice, users, group } = state;

    const permissionGroups = Claim("permissions")?.split(",");
    const openAccess = Claim("openAccess");

    const { schools, group: groupName } = useOutletContext();
    const { response, pending: loading, fetchData, handleResponse } = use(FetchContext);
    const gn = group ? group?.toLowerCase() : groupName;

    const navigate = useNavigate();
    const loc = useLocation();
    const key = loc.state?.key;
    // const [ searchParams ] = useSearchParams();
    // const name = searchParams.get('name') ?? null;

    const refSubmit = useRef(null);
    const refAutocomplete = useRef(null);
    const groupAccountsRef = useRef(null);


    function waitForCollection(timeout = 60000) {
        console.log(120000)
        return new Promise((resolve) => {
            if (groupAccountsRef.current !== null)
                return resolve(groupAccountsRef.current);

            const start = Date.now();
            const interval = setInterval(() => {
                if (groupAccountsRef.current !== null || Date.now() - start >= timeout) {
                    clearInterval(interval);
                    resolve(groupAccountsRef.current);
                }
            }, 100);
        });
    }

    // Get collection by group name
    async function get() {
        try {

            // const messagePromise = shouldFetchMessage
            //     ? ApiRequest("article/popup/message")
            //     : Promise.resolve(null);

            // const [message, collection] = await Promise.all([
            //     messagePromise,
            //     ApiRequest(`data/groups/by/${gn}`),
            // ]);

            groupAccountsRef.current = await fetchData({ api: `data/groups/by/${gn}`, action: "return" })
            if (groupAccountsRef.current?.length == 0) {

                const logged = sessionStorage.getItem("logged");
                if (logged) {
                    const loginTime = new Date(logged).getTime();
                    const now = Date.now();
                    const minutesPassed = (now - loginTime) / (1000 * 60);

                    if (minutesPassed >= 60)
                        navigate("/session/expired");
                }
            }

        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        if (!key) return;

        onReset();
        const collection = groupAccountsRef.current;
        const res = collection?.filter(x => x?.office?.toLowerCase().includes(key.toLowerCase()));
        handleDispatch("byOffice", true);
        handleDispatch("users", Array.isArray(res) ? res : [], "RESULT");
    }, [key])

    useEffect(() => {
        document.title = "UnlockUser | Sök";
    }, []);

    useEffect(() => {
        get();
    }, [gn])

    useEffect(() => {
        if (!permissionGroups)
            return;

        const currentGroup = groupName ? permissionGroups?.find(x => x?.toLowerCase() == groupName) : permissionGroups[0];
        handleDispatch("group", currentGroup, "START");
        onReset();
    }, [groupName])

    function handleDispatch(name, value, type = "PARAM") {
        dispatch({ type: type, name: name, payload: value });
    }

    function onChange(e) {
        if (!groupAccountsRef?.current)
            return;

        const value = e.target.value;
        if ((!isChanged && value?.length < 2)
            || (isChanged && value?.length > (isClass ? 0 : 2))
            || (isClass && !refAutocomplete?.current))
            return;

        handleDispatch("isChanged", !isChanged);
    }

    // Function - submit form
    async function onSubmit(previous, fd) {

        const key = fd.get("key")?.toLowerCase();
        const match = fd.get("match") === "on" ? true : false;
        const school = fd.get("school") ?? null;

        const data = { key: key, match, school };

        // Navigate to search query page
        // let navLink = `/search/${gn}?name=${name.replaceAll(" ", "%20")}`;
        // if(match)
        //     navLink += "&match=on";
        // if(school)
        //     navLink += `&school=${school}`;

        // navigate(navLink, { replace: true });

        let errors = [];
        let error = null;

        if (_.isEqual({ key: "", school: "" }, { key: key, school })) {
            error = "Begäran avvisades. Inga ändringar gjordes i formulärets data."
            return {
                ...data,
                error
            }
        }

        if (errors?.length > 0)
            return { ...data, errors };

        if (groupAccountsRef.current === null)
            await waitForCollection(120000);
        else
            await new Promise(resolve => setTimeout(resolve, 1000));

        const accounts = groupAccountsRef.current;

        let res = null;
        if (accounts?.length > 0) {
            if (gn === "support") {
                if (byOffice)
                    res = accounts?.filter(x => x?.office?.toLowerCase().includes(key));
                else
                    res = accounts?.filter(x => (match ? x?.displayName?.toLowerCase() === key :
                        (x?.displayName?.toLowerCase().includes(key) || x.email?.toLowerCase().startsWith(key.replace(" ", ".")))));
            } else {

                res = (isClass)
                    ? accounts?.filter(x => x?.department?.toLowerCase() === key && x?.office === school)?.sort((a, b) => a.displayName?.toLowerCase().localeCompare(b.displayName?.toLowerCase()))
                    : accounts?.filter(x => (match ? x?.displayName?.toLowerCase() === key :
                        (x?.displayName?.toLowerCase().includes(key) || x.email?.toLowerCase().startsWith(key.replace(" ", "."))))
                        && (openAccess ? x : (!x.permissions || x?.permission?.groups?.length == 0)));

                // start: 2026-08-27 09:57
                if (isClass && res?.length > 0 && res.find(x => !x.lastLoginTime) !== null) {
                    const now = new Date();
                    // School year starts in August: Aug-Dec use this year, Jan-Jul use previous year
                    const schoolYearStartYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
                    const schoolYearStart = new Date(schoolYearStartYear, 7, 1);

                    res = res.map(item => {
                        let lastTime = item?.lastLoginTime;
                        if (!lastTime)
                            return item;

                        let date = lastTime != null ? new Date(lastTime) : null;
                        if (date === null || date > schoolYearStart) {
                            return item;
                        }
                    }).filter(Boolean);
                }
                // end
            }
        }

        // start: 2026-09-03
        handleDispatch("users", Array.isArray(res) ? res : [], "RESULT");
        // end
        return Array.isArray(res) ? null : data;
    }

    function onReset() {
        if (response)
            handleResponse();

        dispatch({ type: "RESET" });
    }

    const [formState, formAction, pending] = useActionState(onSubmit, {
        name: "",
        match: false,
        school: "",
        errors: null
    });

    const noResultView = <Message res={{
        color: "warning", msg: "Inga resultat hittades." +
            "\n\nMöjliga orsaker:" +
            "\n• Sökparametrarna kan vara felstavade." +
            "\n• Personen, skolan eller klassen finns inte i databasen.." +
            "\n• Du saknar behörighet att hantera personens/classens konto." +
            "\n• Du försöker ändra lösenordet för ett administratörskonto. Av säkerhetsskäl får administratörer inte ändra lösenord för andra administratörer." +
            "\n\n Försök att justera din sökning eller kontrollera stavningen." +
            "\n\n\n <span style='color: #cc0000;font-style: normal;font-weight:bold'>Observera!</span> Om du tidigare under den pågående sessionen kunde hitta personen men inte längre kan göra det, kan det bero på att tiden för personsökningen har löpt ut." +
            "\n<a href='/session/logout' style='color: var(--color-active)'>Logga ut</a> och logga in igen för att fortsätta använda webbplatsen."
    }} cancel={onReset} />;

    // start: 2026-08-27 10:13
    const schoolYearStartLabel = (() => {
        const now = new Date();
        const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
        return new Date(year, 7, 1).toLocaleDateString("sv-SE", { month: "long", year: "numeric" });
    })();
    // end

    return (
        <>
            {/* Search form */}
            <form key={isCleaned} className='d-row search-form w-100' action={formAction}>

                {/* Collections list to choose */}
                {isClass && <AutocompleteList
                    label="Skolnamn"
                    name="school"
                    collection={schools}
                    required={true}
                    shrink={true}
                    disabled={loading || pending}
                    defValue={formState ? formState?.school : ""}
                    keyword="id"
                    ref={refAutocomplete}
                />}

                {/* Field name */}
                <TextField
                    name="key"
                    label={isClass ? "Klassbeteckning" : "Namn"}
                    required
                    fullWidth
                    autoComplete="off"
                    autoSave="off"
                    defaultValue={formState?.name ?? ""}
                    onChange={onChange}
                    className={`${gn !== "support" ? "search-wrapper " : ""}w-100`}
                    InputProps={{
                        maxLength: 30,
                        minLength: 2,
                        endAdornment: <InputAdornment position="end">
                            {/* Checkbox and search by office */}
                            {gn === "support" && <FormControlLabel
                                control={<Checkbox
                                    name="match"
                                    disabled={pending}
                                    checked={byOffice}
                                    onClick={() => {
                                        handleDispatch("byOffice", !byOffice)
                                        handleDispatch("isMatch", false)
                                    }} />}
                                label="Avdelning/Skola" />}

                            {/* Checkbox and radio with search parameters to choose for user search */}
                            {!isClass && <FormControlLabel
                                control={<Checkbox
                                    name="match"
                                    disabled={isClass || pending}
                                    checked={isMatch}
                                    onClick={() => {
                                        handleDispatch("isMatch", !isMatch)
                                        handleDispatch("byOffice", false)
                                    }} />}
                                label="Exakt matchning" />}

                            {/* Reset form - button */}
                            <Button
                                color="error"
                                className="search-reset"
                                type="reset"
                                disabled={loading || !isChanged || pending}
                                onClick={() => dispatch({ type: "RESET" })}
                                edge="end">
                                <SearchOffSharp />
                            </Button>

                            {/* Submit form - button */}
                            <Button variant={isChanged ? "contained" : "outlined"}
                                color={isChanged ? "primary" : "inherit"}
                                className="search-button"
                                type="submit"
                                disabled={!isChanged || loading || pending}
                                ref={refSubmit}
                                edge="end">
                                <SearchSharp />
                            </Button>
                        </InputAdornment>
                    }}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading || pending}
                    placeholder={!groupAccountsRef?.current ? "Data hämtas, var vänlig och vänta ..." : (isClass
                        ? "Skriv exakt klassbeteckning här ..."
                        : (isMatch ? "Skriv exakt fullständigt namn eller anvädarnamn här ..." : "Sök ord här ..."))
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter")
                            refSubmit.current?.click();
                    }}
                />

                {/* Choose group */}
                {(permissionGroups?.length > 1 && gn !== "support") && <DropdownMenu
                    label="Hanteras"
                    list={permissionGroups}
                    value={group ? group : ""}
                    link="/search/"
                    disabled={permissionGroups?.length === 1 || !groupAccountsRef?.current} />}
            </form>


            {/* Radio buttons to choice one of search alternatives */}
            {(gn === "studenter" && gn !== "support") && <FormControl className="actions-wrapper d-row ai-end w-100">
                <RadioGroup
                    row
                    name="row-radio-buttons-group">

                    {/* Loop of radio input choices */}
                    {radioChoices?.map((p, index) => (
                        <FormControlLabel
                            key={index}
                            control={<Radio
                                checked={p.value === "user" ? !isClass : isClass}
                                color="success" />}
                            label={p.label}
                            onChange={() => handleDispatch("isClass", !isClass, "SEARCH_OPTION")} />
                    ))}
                </RadioGroup>
            </FormControl>}

            {/* Result info box */}
            <div className='d-row jc-between w-100 result-box'>
                {/* Result info */}
                <div className="vlr-info d-column ai-start">
                    <span>{pending ? "Sökning pågår..." : "Resultat"}</span>
                    <span className="d-row jc-start" style={{ color: users ? "var(--color-active)" : "var(--color-gray)" }}>
                        {users?.length > 0 && <List size="small" color="primary" style={{ marginRight: 10 }} />}
                        {users ? `${users?.length} användare` : "*****************"}
                    </span>
                </div>

                {/* Actions */}
                <div className="d-row">
                    {/* Button to reset search result */}
                    {users?.length > 0 && <Tooltip
                        title="Rensa sökresultaten."
                        classes={{ tooltip: "tooltip tooltip-red", arrow: "tooltip-arrow-red" }}
                        arrow>
                        <IconButton variant="text"
                            color="error"
                            className="reset-button"
                            onClick={onReset} >
                            <Close />
                        </IconButton>
                    </Tooltip>}

                    {users?.length == 0 && <Button component={NavLink} color="secondary" to="/view/my/permissions">
                        Kontrollera mina behörigheter
                    </Button>}

                    {/* Modal  window with help texts */}
                    <ModalView
                        label="Förklaring av sökparametrar"
                        content={gn === "studenter" ? AllTips : Tips} />
                </div>

                {/* Loading */}
                {!groupAccountsRef?.current && <LinearProgress color="primary" className="box-loading" />}
            </div>

            {/* start: 2026-08-27 10:13 */}
            {(isClass && users?.length > 0 && !pending) && <Message
                res={{
                    color: "info",
                    msg: (users.find(x => !x.lastLoginTime) !== null ? `Listan visar endast elever som har loggat in sedan ${schoolYearStartLabel} (innevarande läsår). Elever som inte loggat in sedan dess visas inte här.\n` : null) +
                        "Saknas en elev i listan? Sök då efter eleven separat med användarnamn under alternativet \"Användare\"." // 2026-08-27 10:16
                }} />}
            {/* end */}

            {/* List loading */}
            {(!users || pending) && <ListLoading rows={5} pending={pending} />}

            {/* No result - message */}
            {(users?.length === 0 && !pending) && noResultView}

            {/* Results of search */}
            {(users?.length > 0 && !pending) && <ListsView
                list={users}
                grouped="office"
                openAccess={openAccess}
                group={gn}
                multiple={isClass}
            />}
        </>
    )
}

export default Home;