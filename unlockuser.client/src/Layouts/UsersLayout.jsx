import { useState, useEffect, use } from 'react';

// Installed
import { Outlet, useNavigation, useLoaderData, NavLink, useParams, useRevalidator } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import { Refresh, Forward } from '@mui/icons-material';

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

    const { fetchData, response, pending, success } = use(FetchContext);
    const loaded = useLoaderData();
    const { moderators, groups } = loaded;

    const navigation = useNavigation();
    const { group, id } = useParams();
    const revalidator = useRevalidator();

    const groupName = Capitalize(group);

    const [searchValue, setSearchValue] = useState(null);
    const [searchTooltipOpen, setSearchTooltipOpen] = useState(false);

    useEffect(() => {
        document.title = "UnlockUser | Moderators";
    }, [])

    useEffect(() => {
        setSearchTooltipOpen(true);

        const timer = setTimeout(() => setSearchTooltipOpen(false), 4000);
        return () => clearTimeout(timer);
    }, [id])

    useEffect(() => {
        if (searchValue)
            setSearchValue(null);
    }, [group])

    useEffect(() => {
        if (!success) return;
        console.log(success)
        revalidator.revalidate();
    }, [success, revalidator])


    async function renewList() {
        await fetchData({ api: "catalogs/renew/saved", method: "post", action: "success" });
        sessionStorage.setItem("updated", new Date().toISOString());
    }

    const groupsLinks = groups?.map((name, index) => (
        <NavLink className="link-group" to={`/moderators/${name?.toLowerCase()}`} key={index} >{name}</NavLink>
    ));

    const moderatorsByGroup = group ? moderators?.filter(x => x.permissions?.groups?.includes(groupName)) : moderators;
    const moderator = id ? moderatorsByGroup?.find(x => x.username === id) : null;
    const secondaryRow = id
        ? `${moderator?.office} | <span class="secondary-span">${moderator?.title}</span>`
        : groupsLinks;
    const showSearch = !id || moderator?.permissions?.groups?.includes("Personal");

    const loading = navigation.state === "loading";
    const renewDisabled = sessionStorage.getItem("updated");
    const renewTime = new Date(renewDisabled).toLocaleDateString() + " " + new Date(renewDisabled).toLocaleTimeString();

    return (
        <>
            <Header disabled={loading} supportMode={true} />

            <div className="container d-column jc-start w-100 fade-in-slow">

                {/* Tab menu */}
                <TabPanel
                    primary={id ? moderator?.displayName : "Moderators"}
                    secondary={secondaryRow} initialsView={!!id}>

                    {/* Tooltip message */}
                    {(id && showSearch) && <Tooltip title="Sök efter en anställd för att lägga till personen i listan över godkända anställda för den valda personen."
                        open={searchTooltipOpen}
                        onOpen={() => setSearchTooltipOpen(true)}
                        onClose={() => setSearchTooltipOpen(false)}
                        classes={{
                            tooltip: "tooltip-info",
                            arrow: "tooltip-arrow-info"
                        }} placement="left" arrow>
                        <Forward color="primary" style={{ marginRight: "20px", opacity: searchTooltipOpen ? 1 : 0.1 }} />
                    </Tooltip>}

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
                        <Tooltip title={!!renewDisabled ? `Uppdaterad ${renewTime}` : "Uppdatera listan"} classes={{
                            tooltip: "tooltip-default"
                        }} arrow>
                            <span>
                                <IconButton
                                    size='large'
                                    variant='outlined'
                                    disabled={loading || !!renewDisabled}
                                    onClick={renewList}>
                                    <Refresh />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </div>}
                </TabPanel>

                <Outlet key={`${group}_${searchValue}_${id}`}
                    context={!id
                        ? {
                            moderators: (searchValue
                                ? moderatorsByGroup?.filter(x => JSON.stringify(x).toLowerCase().includes(searchValue?.toLowerCase()))
                                : moderatorsByGroup),
                            onReset: () => setSearchValue(null)
                        } : { ...loaded, moderator, searchValue }} />

                {/* Loading */}
                {loading && <LinearLoading size={30} />}
                {pending && <LinearLoading loading="progress" color="success" />}

            </div>
        </>
    )
}

export default UsersLayout;