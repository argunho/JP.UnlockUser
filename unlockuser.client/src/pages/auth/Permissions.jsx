import { use } from 'react'; // 2026-11-24 10:26

// Installed
import { useLoaderData, useRevalidator } from 'react-router-dom'; // 2026-11-24 10:26
import { School, MapsHomeWork, Refresh } from '@mui/icons-material'; // 2026-11-24 10:26
import { Typography, IconButton, Tooltip, CircularProgress } from '@mui/material'; // 2026-11-24 10:26

// Components
import TabPanel from './../../components/blocks/TabPanel';
import ListView from '../../components/lists/ListView';
import Message from '../../components/blocks/Message';

// Functions
import { Claim } from '../../functions/DecodedToken';

// Storage
import { FetchContext } from '../../storage/FetchContext'; // 2026-11-24 10:26

function Permissions() {

    const { schools, managers, offices } = useLoaderData();
    const roles = Claim("roles");

    // start: 2026-11-24 10:26
    const { fetchData, pending, success, response, handleResponse } = use(FetchContext);
    const revalidator = useRevalidator();

    // Renew the cached lists of users this user can manage (after changed permissions), then reload the permissions view
    async function onRenew() {
        await fetchData({ api: "data/renew/stored", method: "post", action: "done" });
        revalidator.revalidate();
    }

    const renewing = pending || revalidator.state === "loading";
    // end

    return (
        <>
            {/* Tab menu */}
            {/* start: 2026-11-24 10:26 */}
            <TabPanel primary="Mina behörigheter">
                <Tooltip title="Uppdatera listorna med användare enligt dina aktuella behörigheter" 
                classes={{
                    tooltip: "tooltip-white"
                }} placement="left" arrow>
                    <span>
                        <IconButton onClick={onRenew} disabled={renewing} sx={{ marginRight: "20px" }}>
                            {renewing ? <CircularProgress size={22} /> : <Refresh />}
                        </IconButton>
                    </span>
                </Tooltip>
            </TabPanel>

            {/* Renew result */}
            {(success && !renewing) && <Message res={{ color: "success", msg: "Listorna har uppdaterats." }} cancel={() => handleResponse()} />}
            {response && <Message res={response} cancel={() => handleResponse()} />}
            {/* end */}

            {/* Message */}
            {(schools?.length == 0 && managers?.length == 0) && <Message res={{ 
                color: "warning", 
                msg: `Du har rollen/rollerna ${roles}, men saknar behörighet att ändra lösenord för andra anställda eller elever.`}} close={false} />}

            <div className="form-wrapper w-100">
                {schools?.length > 0 && <>
                    <Typography mt={2} variant="h5">Studenter</Typography>
                    <ListView list={schools} avatar={<School />} fullWith={false} />
                </>}

                
                {(managers?.length > 0 || offices?.length > 0) && <>
                    <Typography mt={3} variant="h5">Personal</Typography>
                    {managers?.length > 0 && <ListView list={managers} avatar={<MapsHomeWork />} fullWith={false} />}
                    {offices?.length > 0 && <ListView list={offices} avatar={<MapsHomeWork />} fullWith={false} />}
                </>}
            </div>
        </>
    )
}

export default Permissions;
