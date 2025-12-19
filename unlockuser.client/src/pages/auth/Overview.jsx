import { useEffect, useState, use, useRef } from 'react';

// Installed
import { useOutletContext, useNavigate, useLoaderData } from 'react-router-dom';
import { IconButton, FormControl, TextField, InputAdornment, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { ChevronRight, Policy, Edit, SearchSharp, SearchOffSharp } from '@mui/icons-material';

// Components
import TabPanel from '../../components/blocks/TabPanel';
import Message from '../../components/blocks/Message';

// Functions
import { DecodedClaims } from './../../functions/DecodedToken';

// Storage
import { FetchContext } from '../../storage/FetchContext';

const messages = {
    info: {
        color: "info",
        msg: `Sök efter en anställd eller student här för att kontrollera om <span style="color: red">{name}</span> har rätt att ändra lösenordet för den valda personen.`
    },
    success: {
        color: "success",
        msg: "Behörighet för lösenordsändring är tillgänglig."
    },
    forbid: {
        color: "warning",
        msg: "Administratörer får inte ändra lösenord för andra administratörer."
    },
    warning: {
        color: "warning",
        msg: "{name} saknar behörigheter att ändra lösenord till den valda personen."
    },
    error: {
        color: "warning",
        msg: "{name} tillhör inte gruppen för lösenordshantering."
    },
    none: {
        color: "warning",
        msg: "Den valda personen hittades inte."
    },
    same: {
        color: "warning",
        msg: "Den valda personen och {name}, samma personen."
    }
}


function Overview() {

    const [message, setMessage] = useState(messages?.info);

    const reqUser = useLoaderData();
    const { id, collections, loading } = useOutletContext();

    const { permissions, groups, access } = DecodedClaims();
    const { fetchData, response } = use(FetchContext)

    const collection = collections ? groups.split(",").flatMap(g => collections[g.toLowerCase()]) : [];
    const user = collection ? collection.find(x => x.name === id) : reqUser;
    console.log(user)
    const accessToPasswordManage = JSON.parse(permissions).passwordManageGroups?.find(x => x.Name === user.group) != null;

    const navigate = useNavigate();
    const ref = useRef(null);

    useEffect(() => {
        if (!access)
            navigate(-1);
    }, [])

    async function onSubmit() {
        const value = ref.current.value;
        if (!value || value.length == 0)
            return;
        console.log(value.slice(5))
        console.log(Number(value.slice(5)))
        console.log(parseInt("we234"))
        console.log(Number("we234"))

        var userToCheck = collection?.length > 0
            ? collection.find(x => x.name === value || x.email === value)
            : await fetchData({ api: `user/by/${value}`, method: "get", action: "return" });

        if (!userToCheck)
            setMessage(messages.none)
        else if (user?.name === userToCheck?.name)
            setMessage(messages.same);
        else if (userToCheck?.permissions?.passwordManageGroups?.length > 0)
            setMessage(messages.forbid);
        else if (!user.permissions?.groups?.includes(userToCheck?.group))
            setMessage(messages.error);
        else if (userToCheck?.group !== "Studenter" ? !user.permissions?.managers?.includes(userToCheck.manager) : !user.permissions?.offices?.includes(userToCheck.office))
            setMessage(messages.warning);
        else
            setMessage(messages.success)
    }

    // If user not found
    if(!loading && !user)
        return <Message res={response ?? messages.none} cancel={() => navigate(-1)} />;

    return <>
        {/* Tab menu */}
        <TabPanel primary={user.primary ?? "Anvädarprofil"} secondary={
            `<span class="secondary-span view">${user?.title ? user?.title : (user?.passwordLength > 8 ? "Anställd" : "Student")}</span>`
        }>
            {/* If account is blocked */}
            <div className="d-row">
                {user?.isLocked && <span className="unlock-span locked-account">Kontot är låst</span>}

                {/* If the current user has permission to set or reset the password for the viewed user.. */}
                {accessToPasswordManage && <IconButton
                    sx={{ marginRight: "20px" }}
                    onClick={() => navigate(`/manage/${user?.group?.toLowerCase()}/user/${user?.name}`)}>
                    <Edit />
                </IconButton>}
            </div>
        </TabPanel>

        <div className="d-row jc-start w-100">

            {/* User profile info */}
            <section className="d-column ai-start w-100 view">
                <h3>Användarnamn</h3>
                <span> - {user?.name}</span>
                <h3>Email</h3>
                <span> - {user?.email}</span>
                <h3>{user?.passwordLength > 8 ? "Arbetspalts" : "Plats"}</h3>
                <span> - {user?.office} {(user?.office != user?.department) ? user.department : ""}</span>
                {user?.passwordLength > 8 && <>
                    <h3>Förvaltning</h3>
                    <span> - {user?.division}</span>
                </>}
            </section>

            {/* IIf the user is a member of any password management group. */}
            {user?.passwordManageGroups && <section className="d-column ai-start search w-100 swing-in-right-bck">
                <TextField
                    fullWidth
                    key={message.msg}
                    inputRef={ref}
                    className="w-100"
                    placeholder={collection?.length > 0 ? "Sök med anvädarnamn/email ..." : "Sök med användarnamn"}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">
                            {/* Reset form - button */}
                            <IconButton
                                color="error"
                                type="reset"
                                className="search-reset"
                                onClick={() => setMessage(messages.info)}
                            >
                                <SearchOffSharp />
                            </IconButton>

                            {/* Submit form - button */}
                            <IconButton
                                onClick={onSubmit}
                                sx={{ marginRight: "5px" }} >
                                <SearchSharp />
                            </IconButton>
                        </InputAdornment>
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter')
                            onSubmit();
                    }}
                />


                {/* Response from server */}
                {response && <Message res={response} cancel={() => navigate(-1)} />}
                {/* Local response */}
                {!response && <Message res={{ ...message, msg: message?.msg?.replace(/\{name\}/g, user.displayName) }} />}

            </section>}

        </div>
    </>
}

export default Overview;
