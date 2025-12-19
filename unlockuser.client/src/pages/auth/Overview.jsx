import { useEffect, useState, use, useRef } from 'react';

// Installed
import { useOutletContext, useNavigate } from 'react-router-dom';
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
    secondary: {
        color: "secondary",
        msg: "Administratörer får inte ändra lösenord för andra administratörer."
    },
    warning: {
        color: "warning",
        msg: "{name} saknar behörigheter att ändra lösenord till den valda personen."
    },
    error: {
        color: "error",
        msg: "{name} tillhör inte gruppen för lösenordshantering."
    },
    none: {
        color: "default",
        msg: "Den valda personen hittades inte."
    },
    same: {
        color: "default",
        msg: "Den valda personen och {name}, samma personen."
    }
}


function Overview() {

    const [message, setMessage] = useState(messages?.info);

    const { id, collections } = useOutletContext();

    const { permissions, groups, access } = DecodedClaims();
    const { fetchData, resData, response } = use(FetchContext)

    const collection =  groups.split(",").flatMap(g => collections[g.toLowerCase()])
    const user = collection.find(x => x.name === id);
    const accessToPasswordManage = JSON.parse(permissions)?.find(x => x.Name === user.group) != null;

    console.log(user, JSON.parse(permissions))
    const navigate = useNavigate();
    const ref = useRef(null);

    useEffect(() => {
        if (!access)
            navigate(-1);
    }, [])
console.log(user)
    function onSubmit() {
        const value = ref.current.value;
        var userToCheck = collection.find(x => x.name === value || x.email === value);
        if(!user)
            setMessage(messages.none)
        if(user === userToCheck)
            setMessage(messages.same);
        else if(userToCheck?.passwordManageGroups?.trim()?.length > 0)
            setMessage(messages.secondary);
        else if(!user.permissions?.groups?.includes(userToCheck?.group))
            setMessage(messages.error)
        else if(userToCheck?.group !== "Studenter" ? !user.permissions?.managers?.includes(userToCheck.manager) : !user.permissions?.offices?.includes(userToCheck.office))
         setMessage(messages.warning)
        else
            setMessage(messages.success)
    }

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


            {user?.passwordManageGroups && <section className="d-column ai-start search w-100 swing-in-right-bck">
                <TextField
                    fullWidth
                    inputRef={ref}
                    className="w-100"
                    placeholder="Sök med anvädarnamn/email ..."
                    InputProps={{
                        endAdornment: <InputAdornment position="end">
                            {/* Reset form - button */}
                            <IconButton
                                color="error"
                                type="reset"
                                className="search-reset"
                                // disabled={!isChanged}
                                edge="end">
                                <SearchOffSharp />
                            </IconButton>

                            {/* Submit form - button */}
                            <IconButton
                                // color={isChanged ? "primary" : "inherit"}
                                onClick={onSubmit}
                                sx={{ marginRight: "5px" }}
                                edge="end">
                                <SearchSharp />
                            </IconButton>
                        </InputAdornment>
                    }} />


                <Message res={{...message, msg: message?.msg?.replace(/\{name\}/g, user.displayName)}} />

            </section>}

        </div>
    </>
}

export default Overview;
