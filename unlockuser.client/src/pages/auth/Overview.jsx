import { useEffect, useState, use, useRef } from 'react';

// Installed
import { useOutletContext, useNavigate, useLoaderData } from 'react-router-dom';
import { IconButton, TextField, InputAdornment, Alert } from '@mui/material';
import { Edit, SearchSharp, SearchOffSharp } from '@mui/icons-material';

// Components
import TabPanel from '../../components/blocks/TabPanel';
import Message from '../../components/blocks/Message';

// Functions
import { DecodedClaims } from './../../functions/DecodedToken';

// Storage
import { FetchContext } from '../../storage/FetchContext';
import { Button } from '@mui/material';

const messages = {
    info: {
        color: "info",
        msg: `Sök efter en anställd eller student här för att kontrollera om {name} har rätt att ändra lösenordet för den valda personen.`
    },
    success: {
        color: "success",
        msg: "{name} har behörighet att ändra lösenord."
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
        msg: "{name} tillhör inte gruppen {group} för lösenordshantering."
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
    const [checked, setChecked] = useState(null);

    const reqUser = useLoaderData();
    const { id, collections, loading } = useOutletContext();

    const { permissions, groups: groupNames, access } = DecodedClaims();
    const { fetchData, response } = use(FetchContext)

    const collection = collections ? groupNames.split(",").flatMap(g => collections[g.toLowerCase()]) : [];
    const user = collection ? collection.find(x => x.name === id) : reqUser;
    const { groups, schools, managers, politicians } = user?.permissions ?? {};

    const accessToPasswordManage = JSON.parse(permissions).Groups.find(x => x === user.group) != null;
    
    const navigate = useNavigate();
    const ref = useRef(null);

    useEffect(() => {
        if (loading) return;

        if (!access)
            navigate(-1);
        else if (!user && !reqUser)
            navigate(`view/user/by/${id}`);
    }, [loading])

    async function onSubmit() {
        const value = ref.current.value;
        if (!value || value.length == 0)
            return;
        else if (!collection && !parseInt(value.slice(0, 6)))
            return;

        var userToCheck = collection?.length > 0
            ? collection.find(x => x.name === value || x.email === value)
            : await fetchData({ api: `user/by/${value}`, method: "get", action: "return" });

        const userManager =  userToCheck?.manager ? userToCheck.manager?.trim()?.substring(3, userToCheck.manager.indexOf(',')) : null;

        setChecked(userToCheck);

        if (!userToCheck)
            setMessage(messages.none)
        else if (user?.name === userToCheck?.name)
            setMessage(messages.same);
        else if (userToCheck?.permissions?.groups?.length > 0)
            setMessage(messages.forbid);
        else if (!groups?.includes(userToCheck?.group))
            setMessage(messages.error);
        else if ((userToCheck?.group === "Studenter" && !schools?.includes(userToCheck.office))
                || (userToCheck?.group === "Personal" && !managers?.includes(userManager))
                || (userToCheck?.group === "Politiker" && !politicians?.includes(userToCheck?.name)))
            setMessage(messages.warning);
        else
            setMessage(messages.success)
    }

    function onReset() {
        setMessage(messages.info);
        setChecked(null);
    }

    // If user not found
    if (!loading && !user)
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
                {accessToPasswordManage?.length > 0 && <IconButton
                    sx={{ marginRight: "20px" }}
                    onClick={() => navigate(`/manage/${user?.group?.toLowerCase()}/user/${user?.name}`)}>
                    <Edit />
                </IconButton>}
            </div>
        </TabPanel>

        <div className="d-row ai-stretch w-100 view-wrapper">

            {/* User profile info */}
            <section className="d-column jc-start ai-start w-100 view">
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
                {groups && <Button variant="outlined" onClick={() => navigate(`/moderators/view/${user?.name}`)} sx={{ marginTop: "30px" }}>Behörigheter</Button>}
            </section>

            {/* IIf the user is a member of any password management group. */}
            {groups?.length > 0 && <section className="d-column jc-start ai-start search w-100 swing-in-right-bck">
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
                                onClick={onReset}
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
                        if (e.key === "Enter")
                            onSubmit();
                    }}
                />

                {/* Response from server */}
                {response && <Message res={response} cancel={() => navigate(-1)} />}

                {/* Local response. Checked user info */}
                {!response && <Alert className="d-column ai-start message-wrapper" icon={false} color={message.color}>
                    {/* User info */}
                    {checked && <div className="w-100 view">

                        <h3>Namn: {checked.displayName}</h3>
                        <div className="d-row jc-between w-100">
                            <div>
                                <h3>Gruppnamn</h3>
                                <span> - {checked?.group}</span>
                            </div>
                            <div>
                                <h3>Arebtesplats</h3>
                                <span> - {checked?.office}</span>
                            </div>
                        </div>
                    </div>}

                    {/* Message */}
                    <Message res={{
                        ...message, msg: message?.msg
                            ?.replace(/\{name\}/g, `<span style="color: red">${user.displayName}</span>`)
                            ?.replace(/\{group\}/g, `<span style="color: red">${checked?.group}</span>`)
                    }} />
                </Alert>}
            </section>}

        </div >
    </>
}

export default Overview;
