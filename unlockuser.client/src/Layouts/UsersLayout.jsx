import { useState, useEffect, use } from 'react';

// Installed
import { Outlet, useNavigation, useLoaderData, NavLink, useParams, useRevalidator } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import { Refresh } from '@mui/icons-material';

// Storage
import { FetchContext } from '../storage/FetchContext';

// Components
import TabPanel from './../components/blocks/TabPanel';
import SearchFilter from '../components/forms/SearchFilter';
import Header from '../components/blocks/Header';
import LinearLoading from '../components/blocks/LinearLoading';

// Functions
import { Capitalize } from '../functions/Helpers';

function UsersLayout() {

    const { fetchData, response, loading: pending, success } = use(FetchContext);
    const loaded = useLoaderData();
    const { moderators, groups } = loaded;

    const navigation = useNavigation();
    const { group, id } = useParams();
    const revalidator = useRevalidator();

    const groupName = Capitalize(group);

    const [searchValue, setSearchValue] = useState(null);

    useEffect(() => {
        document.title = "UnlockUser | Moderators";
    }, [])

    useEffect(() => {
        if (searchValue)
            setSearchValue(null);
    }, [group])

    useEffect(() => {
        if (!success) return;

        revalidator.revalidate();
    }, [success, revalidator])


    async function renewList() {
        await fetchData({ api: "user/renew/saved", method: "post", action: "success" });
        sessionStorage.setItem("updated", "ok");
    }

    const groupsLinks = groups?.map((name, index) => (
        <NavLink className="link-group" to={`/moderators/${name?.toLowerCase()}`} key={index} >{name}</NavLink>
    ));

    const moderatorsByGroup = group ? moderators?.filter(x => x.permissions?.groups?.includes(groupName)) : moderators;
    const moderator = id ? moderatorsByGroup?.find(x => x.username === id) : null;
    const secondaryRow = id
        ? `${moderator?.office} | <span class="secondary-span">${moderator?.title}</span>`
        : groupsLinks;
    const showSearch = !id || moderator?.permissions.groups?.includes("Personal");

    const loading = navigation.state === "loading" || pending;

    return (
        <>
            <Header disabled={loading} supportMode={true} />

            <div className="container d-column jc-start w-100">

                {/* Tab menu */}
                <TabPanel
                    primary={id ? moderator.displayName : "Moderators"}
                    secondary={secondaryRow} initialsView={!!id}>

                    {/* Refresh list */}
                    {showSearch && <div className="d-row">
                        {/* Search filter */}
                        <SearchFilter
                            key={group}
                            label="anställda"
                            disabled={loading || response}
                            onSearch={(value) => setSearchValue(value)}
                            onReset={() => setSearchValue(null)} />

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

                <Outlet key={`${group}_${searchValue}_${id}`} context={!id
                    ? {
                        moderators: (searchValue
                            ? moderatorsByGroup?.filter(x => JSON.stringify(x).toLowerCase().includes(searchValue?.toLowerCase()))
                            : moderatorsByGroup),
                        onReset: () => setSearchValue(null)
                    } : { ...loaded, moderator, searchValue }} />

                {/* Loading */}
                {loading && <LinearLoading size={30} />}
            </div>


        </>
    )
}

export default UsersLayout;