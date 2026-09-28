import { useEffect, useState, use } from 'react';

// Installed
import { useNavigate, useLoaderData } from 'react-router-dom';
import { IconButton, TextField, InputAdornment, Alert, List, ListItem, ListItemIcon, ListItemText, Avatar, Collapse } from '@mui/material';
import {
    Edit, SearchSharp, SearchOffSharp, Label, AlternateEmail,
    Business, AccountBalance, Shield, ArrowForward, FactCheck, KeyboardArrowDown, KeyboardArrowUp
} from '@mui/icons-material';

// Components
import TabPanel from '../../components/blocks/TabPanel';
import Message from '../../components/blocks/Message';
import ListView from './../../components/lists/ListView';

// Functions
import { DecodedClaims } from './../../functions/DecodedToken';
import { CheckEmail, CheckUsername, Initials } from './../../functions/Helpers';

// Storage
import { FetchContext } from '../../storage/FetchContext';

const messages = {
    info: {
        color: "info",
        msg: `Sök efter en anställd eller student här för att kontrollera om {name} har behörighet att ändra lösenordet för den valda personen.`
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
    },
    noPermission: {
        color: "disabled",
        msg: "{name} saknar behörighet att ändra lösenord för någon annan person."
    }
}

function Overview() {
    const { user, moderators, collection } = useLoaderData();

    const { permissions, openAccess, limitedAccess } = DecodedClaims();
    const { fetchData, response } = use(FetchContext);
    const { groups, schools, managers, politicians } = user?.permissions ?? {};

    const accessToPasswordManage = permissions.split(',').find(x => x === user?.group) != null;
    const hasPermission = groups?.length > 0;
    const isEmployee = user?.passwordLength > 8;

    const initials = Initials(user?.displayName ?? user?.username ?? "");

    const navigate = useNavigate();
    // const ref = useRef(null);

    const [message, setMessage] = useState(hasPermission ? messages?.info : messages?.noPermission);
    const [checked, setChecked] = useState(null);
    const [matched, setMatched] = useState([]);
    const [collapsed, setCollapsed] = useState(false);
    const [value, setSearchValue] = useState("");

    // start: 2026-08-28 15:26
    useEffect(() => {
        if (!openAccess && !limitedAccess)
            navigate("/search", { replace: true });
    }, [openAccess, limitedAccess])
    // end

    async function onSubmit() {
        // const value = ref.current.value;
        if (!value || value.length == 0)
            return;
        else if (!collection && !parseInt(value.slice(0, 6)))
            return;

        const equals = CheckUsername(value) || CheckEmail(value);

        var res = collection?.length > 0
            ? (equals ? collection.find(x => x.username === value || x.email === value)
                : collection.filter(x => x?.displayName.toLowerCase().includes(value.toLowerCase())))
            : await fetchData({ api: `user/by/${value}/search/${true}`, method: "get", action: "return" });
        console.log(res)
        if (Array.isArray(res) && res?.length > 1) {
            setMatched(res);
            return;
        } else if (Array.isArray(res))
            handleChecked(res[0]);
        else
            handleChecked(res);
    }

    function handleChecked(userToCheck) {

        setMatched([]);
        const userManager = userToCheck?.manager ? userToCheck.manager?.trim()?.substring(3, userToCheck.manager.indexOf(',')) : null;

        setChecked(userToCheck);

        if (!userToCheck)
            setMessage(messages.none)
        else if (user?.username === userToCheck?.username)
            setMessage(messages.same);
        else if (userToCheck?.permissions?.groups?.length > 0)
            setMessage(messages.forbid);
        else if (!groups?.includes(userToCheck?.group))
            setMessage(messages.error);
        else if ((userToCheck?.group === "Studenter" && !schools?.includes(userToCheck.office))
            || (userToCheck?.group === "Personal" && !managers?.includes(userManager))
            || (userToCheck?.group === "Politiker" && !politicians?.includes(userToCheck?.username)))
            setMessage(messages.warning);
        else
            setMessage(messages.success)
    }

    function onReset() {
        setMessage(messages.info);
        setChecked(null);
        setSearchValue("");
        setMatched([]);
    }

    const profileFields = [
        { label: "Användarnamn", value: user?.username, icon: Label },
        { label: "Email", value: user?.email, icon: AlternateEmail },
        { label: isEmployee ? "Arbetsplats" : "Plats", value: [user?.office, user?.office !== user?.department ? user?.department : null].filter(Boolean).join(" "), icon: Business },
        ...(isEmployee ? [{ label: "Förvaltning", value: user?.division, icon: AccountBalance }] : []),
        ...(groups ? [{
            label: "Behörigheter", value: "", icon: Shield,
            props: {
                secondaryAction: <IconButton onClick={() => navigate(`/moderators/view/${user?.username}`)} sx={{ marginRight: "20px" }} >
                    <ArrowForward />
                </IconButton>
            }
        }] : []),
        ...(moderators?.length > 0 ? [{
            label: `Anställda med behörighet att ändra lösenord för ${user?.displayName ?? user?.username}`,
            value: `Behöriga anställda (${moderators.length})`,
            icon: FactCheck,
            collapse: true,
            props: {
                secondaryAction: <IconButton onClick={() => setCollapsed((open) => !open)} sx={{ marginRight: "20px" }}>
                    {collapsed ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </IconButton>
            }
        }] : [])
    ];

    // If user not found
    if (!user)
        return <Message res={response ?? messages.none} cancel={() => navigate(-1)} />;

    return <>
        {/* Tab menu */}
        <TabPanel primary="Anvädarprofil" secondary={
            `<span class="secondary-span view">${isEmployee ? "Anställd" : "Student"}</span>`
        }>
            {/* If account is blocked */}
            <div className="d-row">
                {user?.isLocked && <span className="unlock-span locked-account">Kontot är låst</span>}

                {/* If the current user has permission to set or reset the password for the viewed user.. */}
                {accessToPasswordManage?.length > 0 && <IconButton
                    sx={{ marginRight: "20px" }}
                    onClick={() => navigate(`/manage/${user?.group?.toLowerCase()}/user/${user?.username}`)}>
                    <Edit />
                </IconButton>}
            </div>
        </TabPanel>

        <div className="d-row ai-stretch w-100 view-wrapper">

            {/* User profile info */}
            <section className="d-column jc-start ai-start w-100 view">
                <div className="profile-card-header d-row jc-start ai-center w-100">
                    <Avatar className="profile-avatar">{initials}</Avatar>
                    <div className="d-column ai-start">
                        <h2>{user?.displayName ?? user?.username}</h2>
                        <span className="profile-subtitle">{user?.title ? user?.title : (isEmployee ? "Anställd" : "Student")}</span>
                    </div>
                </div>

                <List className="profile-list" disablePadding>
                    {profileFields.map(({ label, value, icon: Icon, collapse, props }) => <>
                        <ListItem
                            key={label}
                            // divider={index < profileFields.length - 1}, index
                            disableGutters
                            {...props}
                        >
                            <ListItemIcon className="profile-list-icon">
                                <Icon />
                            </ListItemIcon>
                            <ListItemText primary={value} secondary={label} />

                        </ListItem>

                        {/* Moderators */}
                        {collapse && <Collapse in={collapsed} className='d-row dropdown-block w-100' timeout="auto" unmountOnExit sx={{ display: "block", clear: "both" }}>
                            <List style={{ margin: "0 20px" }}>
                                {moderators?.map((item, index) => {
                                    const collapseProps = !!item?.link ? { onClick: () => navigate(item.link) } : null;
                                    return <ListItem className="w-100" key={index} {...collapseProps}>
                                        <ListItemIcon>
                                            <Avatar className="profile-avatar-small">{Initials(item?.primary)}</Avatar>
                                        </ListItemIcon>
                                        <ListItemText primary={item?.primary} secondary={item?.secondary} />
                                    </ListItem>
                                })}
                            </List>
                        </Collapse>}
                    </>)}
                </List>
            </section>

            {/* If the user is a member of any password management group. */}
            <section className="d-column jc-start ai-start search w-100 swing-in-right-bck">
                <TextField
                    fullWidth
                    key={message.msg}
                    // inputRef={ref}
                    className="w-100"
                    placeholder={collection?.length > 0 ? "Sök med namn/anvädarnamn/email ..." : "Sök med användarnamn"}
                    value={value}
                    onChange={(e) => setSearchValue(e.target?.value)}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">
                            {/* Reset form - button */}
                            <IconButton
                                color="error"
                                type="reset"
                                className="search-reset"
                                disabled={!value || value?.length == 0}
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
                    disabled={!hasPermission || (!openAccess && !limitedAccess)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter")
                            onSubmit();
                    }}
                />

                {/* Matched list */}
                {(matched?.length > 0 && !checked) && <ListView
                    list={matched}
                    initials={true} styles={{ maxHeight: "calc(100vh - 450px)", overflow: "auto" }}
                    onClick={handleChecked} />}

                {/* Response from server */}
                {(response && matched?.length == 0) && <Message res={response} cancel={() => navigate(-1)} />}

                {/* Local response. Checked user info */}
                {(!response && matched?.length == 0) && <Alert className="d-column ai-start message-wrapper" icon={false} color={message.color}>
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
                    }} close={false} />
                </Alert>}
            </section>

        </div>
    </>
}

export default Overview;