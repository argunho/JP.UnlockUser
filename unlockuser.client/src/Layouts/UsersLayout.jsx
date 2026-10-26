import { useState, useEffect, use, useRef } from 'react';

// Installed
import { Outlet, useNavigation, useLoaderData, NavLink, useParams, useRevalidator, useLocation, useNavigate } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import { Refresh, Forward, MapsHomeWork } from '@mui/icons-material';

// Storage
import { FetchContext } from '../storage/FetchContext';

// Components
import TabPanel from './../components/blocks/TabPanel';
import SearchFilter from '../components/forms/SearchFilter';
import Header from '../components/blocks/Header';
import LinearLoading from '../components/blocks/LinearLoading';

// Functions
import { Capitalize } from '../functions/Helpers';
import { Claim } from '../functions/DecodedToken';

function UsersLayout() {

    const { fetchData, response, pending, success } = use(FetchContext);
    const loaded = useLoaderData();
    const { moderators, groups, roles } = loaded;

    const access = {
        open: Claim("openAccess"),
        limited: Claim("limitedAccess")
    };

    const navigation = useNavigation();
    const { group, id } = useParams();
    const revalidator = useRevalidator();
    const navigate = useNavigate();
    const loc = useLocation();
    const key = loc.state?.key;
    const refSearch = useRef();

    const groupName = Capitalize(group);

    const searchValues = {
        work: loc.state?.work,
        value: null
    }

    const [search, setSearch] = useState(searchValues);
    const [searchTooltipOpen, setSearchTooltipOpen] = useState(false);

    useEffect(() => {
        document.title = "UnlockUser | Moderators";
    }, [])

    useEffect(() => {
        setSearchTooltipOpen(true);

        const timer = setTimeout(() => setSearchTooltipOpen(false), 2000);
        return () => clearTimeout(timer);
    }, [id])

    useEffect(() => {
        if (!!search?.value)
            setSearch(searchValues);
    }, [group, success])

    async function renewList() {
        await fetchData({ api: "catalogs/renew/saved", method: "post", action: "success" });
        sessionStorage.setItem("updated", new Date().toISOString());
        revalidate();
    }

    function revalidate() {
        searchCleaner();
        revalidator.revalidate();
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

    function handleSearch(value) {
        setSearch(prev => ({ ...(prev ?? searchValues), value })); // 2026-10-23 12:35
    }

    function searchCleaner(clear) {
        if (clear)
            setSearch(searchValues);
        else
            handleSearch(null);
        
        if (key)
            navigate(loc.pathname, { replace: true, state: { work: search.work } });
    }

    return (
        <>
            <Header disabled={loading} supportMode={true} />

            <div className="container d-column jc-start w-100 fade-in-slow">

                {/* Tab menu */}
                <TabPanel
                    primary={id ? moderator?.displayName : "Moderators"}
                    secondary={secondaryRow}
                    initialsView={!!id}>

                    {/* Tooltip message */}
                    {(id && showSearch) && <Tooltip title="Sök efter en anställd för att lägga till personen i listan över godkända anställda för den valda personen."
                        open={searchTooltipOpen}
                        onOpen={() => setSearchTooltipOpen(true)}
                        onClose={() => setSearchTooltipOpen(false)}
                        classes={{
                            tooltip: "tooltip-info",
                            arrow: "tooltip-arrow-info"
                        }} placement="left" arrow>
                        <Forward
                            color="primary"
                            style={{ marginRight: "20px", opacity: searchTooltipOpen ? 1 : 0.1 }}
                        />
                    </Tooltip>}



                    {/* Refresh list */}
                    {showSearch && <div className="d-row">

                        {/* Search filter */}
                        <SearchFilter
                            key={`${group}_${success}`}
                            label={search?.work ? "arbetsplats" : "anställda"}
                            placeholder={search?.work ? "Office namn.." : null}
                            disabled={loading || response}
                            onSearch={handleSearch}
                            onReset={searchCleaner}
                            searchValue={search?.value}
                            ref={refSearch}>
                            <Tooltip title="Sök arbetsplats." arrow>
                                {/* start: 2026-10-23 12:35 */}
                                {id && <IconButton
                                    style={{ marginRight: "10px" }}
                                    onClick={() => setSearch(prev => ({ ...(prev ?? searchValues), work: !prev?.work }))}>
                                    <MapsHomeWork color={search?.work ? "primary" : "default"} />
                                </IconButton>}
                                {/* end */}
                            </Tooltip>
                        </SearchFilter>


                        {/* Refresh button */}
                        {access?.open && <Tooltip title={!!renewDisabled ? `Uppdaterad ${renewTime}` : "Uppdatera listan"} classes={{
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
                        </Tooltip>}
                    </div>}
                </TabPanel>

                <Outlet key={`${group}_${search?.value}_${id}`}
                    context={!id
                        ? {
                            moderators: (search?.value
                                ? moderatorsByGroup?.filter(x => JSON.stringify(x).toLowerCase().includes(search?.value?.toLowerCase()))
                                : moderatorsByGroup),
                            onReset: () => refSearch.current?.click(), // 2026-08-21 12:31
                            pathname: loc.pathname,
                            key: !!search?.value ? null : key
                        } : { ...loaded, moderator, search, access, roles, revalidate }} />

                {/* Loading */}
                {loading && <LinearLoading size={30} />}
                {pending && <LinearLoading loading="progress" color="success" />}

            </div>
        </>
    )
}

export default UsersLayout;