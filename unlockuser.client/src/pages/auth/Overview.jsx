import { useEffect, useState, use, useRef } from 'react';

// Installed
import { useOutletContext, useNavigate } from 'react-router-dom';
import { IconButton, FormControl, TextField, InputAdornment, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { ChevronRight, Policy, Edit, SearchSharp, SearchOffSharp } from '@mui/icons-material';

// Components
import TabPanel from '../../components/blocks/TabPanel';

// Functions
import { DecodedClaims } from './../../functions/DecodedToken';

// Storage
import { FetchContext } from '../../storage/FetchContext';
import Message from '../../components/blocks/Message';


function Overview() {

    const { id, collections } = useOutletContext();

    const { permissions, groups, access } = DecodedClaims();
    const { fetchData, resData, response } = use(FetchContext)

    const user = groups.split(",").flatMap(g => collections[g.toLowerCase()]).find(x => x.name === id);
    const accessToPasswordManage = JSON.parse(permissions)?.find(x => x.Name === user.group) != null;

    console.log(user, JSON.parse(permissions))
    const navigate = useNavigate();
    const ref = useRef(null);

    useEffect(() => {
        if (!access)
            navigate(-1);
    }, [])

    function onSubmit() {

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

                <Message res={{
                    color: "info",
                    msg: `Sök efter en anställd eller student här för att kontrollera om <span style="color: red">${user?.displayName}</span> har rätt att ändra lösenordet för den valda personen.`
                }} />
            </section>}

        </div>
    </>
}

export default Overview;
