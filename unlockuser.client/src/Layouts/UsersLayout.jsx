import { useState, use } from 'react';

// Installed
import { Outlet, useNavigation, useOutletContext, useLoaderData, NavLink } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import { Refresh } from '@mui/icons-material';

// Storage
import { FetchContext } from '../storage/FetchContext';

// Components
import TabPanel from './../components/blocks/TabPanel';
import SearchFilter from '../components/forms/SearchFilter';

// Functions
import { Capitalize } from '../functions/Helpers';
import { useEffect } from 'react';

function UsersLayout() {
    const [searchWord, setSearchWord] = useState(null);

    const { fetchData, response } = use(FetchContext);

    const navigation = useNavigation();

    const context = useOutletContext();
    context.loading = navigation.state === "loading";
    const { group, loading, id, collections } = context;
    const groups = collections["groups"];

    const { moderators, managers, politicians } = useLoaderData();
    const groupName = Capitalize(group);

    useEffect(() => {
        document.title = "UnlockUser | Moderators";
    }, [])

    useEffect(() => {
        if(searchWord)
            setSearchWord(null);
    }, [group])


    async function renewList() {
        await fetchData({ api: "user/renew/saved", method: "post" });
        sessionStorage.setItem("updated", "true");
    }

    const groupsLinks = groups?.map((name, index) => (
        <NavLink className="link-group" to={`/moderators/${name.toLowerCase()}`} key={index} >{name}</NavLink>
    ));

    const moderatorsByGroup = group ? moderators?.filter(x => x.permissions?.groups?.includes(groupName)) : moderators;
    const moderator = id ? moderatorsByGroup?.find(x => x.name === id) : null;

    const secondaryRow = id 
                    ? `${moderator?.primary} | <span class="secondary-span">${moderator?.office}</span> | <span class="secondary-span">${moderator?.title}</span>`
                    : groupsLinks

    return (
        <div className="d-column jc-start w-100">

            {/* Tab menu */}
            <TabPanel 
                primary={id ? `Behörighetslista` : "Moderators"}   
                secondary={secondaryRow} >

                {/* Refresh list */}
                {!id && <div className="d-row">
                    {/* Search filter */}
                    <SearchFilter key={group} label="anställda" disabled={loading || response}
                        onSearch={(value) => setSearchWord(value)} onReset={() => setSearchWord(null)} />

                    {/* Refresh button */}
                    <Tooltip title="Uppdatera listan" classes={{
                        tooltip: "tooltip-default"
                    }} arrow>
                        <span>
                            <IconButton
                                size='large'
                                variant='outlined'
                                disabled={loading || !!sessionStorage.getItem("updated")}
                                onClick={renewList}>
                                <Refresh /> 
                            </IconButton>

                        </span>
                    </Tooltip>
                </div>}
            </TabPanel>

            <Outlet key={`${group}_${searchWord}_${id}`}
                context={{
                    ...context,
                    moderators: (searchWord
                        ? moderatorsByGroup?.filter(x => JSON.stringify(x).toLowerCase().includes(searchWord?.toLowerCase()))
                        : moderatorsByGroup),
                    moderator,
                    managers, 
                    politicians,
                    groups,
                    onReset: () => setSearchWord(null)
                }} />
        </div>
    )
}

export default UsersLayout;