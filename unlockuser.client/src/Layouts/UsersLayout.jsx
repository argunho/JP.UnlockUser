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

function UsersLayout() {
    const [searchWord, setSearchWord] = useState(null);

    const { fetchData, response } = use(FetchContext);

    const navigation = useNavigation();

    const context = useOutletContext();
    context.loading = navigation.state === "loading";
    const { group, loading, id, collections } = context;
    const groups = collections["groups"];

    const moderators = useLoaderData();
    const groupName = Capitalize(group);

    async function renewList() {
        await fetchData({ api: "user/renew/cached/data", method: "post" });
        sessionStorage.setItem("updated", "true");
    }

    const groupsLinks = groups?.map((name, index) => (
        <NavLink className="link-group" to={`/moderators/${name.toLowerCase()}`} key={index} >{name}</NavLink>
    ));

    const moderatorsByGroup = group ? moderators?.filter(x => x.permissions?.passwordManageGroups?.includes(groupName)) : moderators;
    const moderator = id ? moderatorsByGroup?.find(x => x.name === id) : null;

    console.log(searchWord)

    return (
        <div className="d-column jc-start w-100">

            {/* Tab menu */}
            <TabPanel primary={id ? `Behörighetslista` : "Moderators"} 
                secondary={id ? `${moderator?.secondary} | <span class="secondary-span">${moderator?.title}</span>` : groupsLinks} >

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
                    moderators:
                        searchWord
                            ? moderatorsByGroup?.filter(x => JSON.stringify(x).toLowerCase().includes(searchWord?.toLowerCase()))
                            : moderatorsByGroup,
                    moderator,
                    onReset: () => setSearchWord(null)
                }} />
        </div>
    )
}

export default UsersLayout;