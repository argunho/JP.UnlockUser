// start: 2026-11-24 12:20
import { useState, use } from 'react'; // 2026-11-24 14:10

// Installed
import { useLoaderData, useRevalidator } from 'react-router-dom';
import { Refresh, DeleteOutline, Check, Close } from '@mui/icons-material'; // 2026-11-24 14:10
import {
    IconButton, Tooltip, CircularProgress, Typography, Paper,
    TableContainer, Table, TableHead, TableBody, TableRow, TableCell
} from '@mui/material';

// Components
import TabPanel from '../../components/blocks/TabPanel';
import Message from '../../components/blocks/Message';
import SearchFilter from '../../components/forms/SearchFilter';

// Storage
import { FetchContext } from '../../storage/FetchContext'; // 2026-11-24 14:10

// Shows what is stored in the server's IMemoryCache (keys, types, item count and statistics), data from api/data/cache/keys
function CacheMemory() {

    const data = useLoaderData();
    const revalidator = useRevalidator();
    const [search, setSearch] = useState("");

    const entries = Array.isArray(data) ? data : (data?.entries ?? []);
    const statistics = data?.statistics;
    const loading = revalidator.state === "loading";

    // start: 2026-11-24 14:10
    const { fetchData, pending, response, handleResponse } = use(FetchContext);
    const [confirmKey, setConfirmKey] = useState(null); // the key whose removal waits for confirmation

    // Remove one entry from the server cache, then reload the list
    async function onRemove(key) {
        setConfirmKey(null);
        await fetchData({ api: `data/cache/${encodeURIComponent(key)}`, method: "delete", action: "done" });
        revalidator.revalidate();
    }
    // end

    const hits = statistics?.totalHits ?? 0;
    const misses = statistics?.totalMisses ?? 0;
    const hitRate = (hits + misses) > 0 ? `${Math.round(hits / (hits + misses) * 100)} %` : "–";

    const cards = [
        { label: "Poster", value: data?.count ?? entries.length },
        { label: "Träffar", value: hits },
        { label: "Missar", value: misses },
        { label: "Träffsäkerhet", value: hitRate }
    ];

    const filtered = entries.filter(x => x?.key?.toLowerCase().includes(search.trim().toLowerCase()));

    // "List`1" -> "List"
    const typeName = (type) => type?.replace(/`\d+/g, "") ?? "–";

    return (
        <>
            {/* Tab menu */}
            <TabPanel primary="Cacheminne" secondary="Innehåll i serverns IMemoryCache (endast nycklar, inte data)">

                        {/* Search filter */}
                        <SearchFilter
                            key={search}
                            label="nyckel"
                            placeholder=""
                            onSearch={(value) => setSearch(value)}
                            onReset={() => setSearch()}
                            searchValue={search} />

                <Tooltip title="Uppdatera" classes={{ tooltip: "tooltip-white" }} placement="left" arrow>
                    <span>
                        <IconButton onClick={() => revalidator.revalidate()} disabled={loading} sx={{ marginRight: "20px" }}>
                            {loading ? <CircularProgress size={22} /> : <Refresh />}
                        </IconButton>
                    </span>
                </Tooltip>
            </TabPanel>

            {/* No answer from the server */}
            {!data && <Message res={{ color: "warning", msg: "Kunde inte hämta innehållet i cacheminnet." }} close={false} />}
            {response && <Message res={response} cancel={() => handleResponse()} />} {/* 2026-11-24 14:10 - error when removing */}

            {/* Statistics */}
            <div className="d-row jc-start w-100" style={{ gap: "15px", flexWrap: "wrap", marginTop: "10px" }}>
                {cards.map(card => (
                    <Paper key={card.label} variant="outlined" sx={{ padding: "12px 20px", minWidth: "calc((100% / 4) - 43.6px)" }}>
                        <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                        <Typography variant="h5">{card.value}</Typography>
                    </Paper>
                ))}
            </div>


            {/* Entries */}
            <TableContainer component={Paper} variant="outlined" sx={{ marginBottom: "30px", border: "none" }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell><b>Nyckel</b></TableCell>
                            <TableCell><b>Typ</b></TableCell>
                            <TableCell align="right"><b>Antal</b></TableCell>
                            <TableCell align="right" width={110}><b>Åtgärd</b></TableCell> {/* 2026-11-24 14:10 */}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map(entry => (
                            <TableRow key={entry.key} hover>
                                <TableCell>{entry.key}</TableCell>
                                <TableCell>{typeName(entry.type)}</TableCell>
                                <TableCell align="right">{entry.count ?? "–"}</TableCell>
                                {/* start: 2026-11-24 14:10 */}
                                <TableCell align="right">
                                    {confirmKey === entry.key ? <>
                                        <Tooltip title="Ta bort" arrow>
                                            <IconButton size="small" color="error" onClick={() => onRemove(entry.key)}>
                                                <Check fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Avbryt" arrow>
                                            <IconButton size="small" onClick={() => setConfirmKey(null)}>
                                                <Close fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </> : <Tooltip title="Ta bort från cacheminnet" arrow>
                                        <span>
                                            <IconButton size="small" color="error" disabled={pending || loading} onClick={() => setConfirmKey(entry.key)}>
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>}
                                </TableCell>
                                {/* end */}
                            </TableRow>
                        ))}

                        {filtered.length === 0 && <TableRow>
                            <TableCell colSpan={4} align="center">Inga poster</TableCell> {/* 2026-11-24 14:10 */}
                        </TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}

export default CacheMemory;
// end
