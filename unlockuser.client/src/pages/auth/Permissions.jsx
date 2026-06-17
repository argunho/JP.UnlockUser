// Installed
import { useLoaderData } from 'react-router-dom';
import { School, MapsHomeWork } from '@mui/icons-material';
import { Typography } from '@mui/material';

// Components
import TabPanel from './../../components/blocks/TabPanel';
import ListView from '../../components/lists/ListView';
import Message from '../../components/blocks/Message';

// Functions
import { Claim } from '../../functions/DecodedToken';


function Permissions() {

    const { schools, managers } = useLoaderData();
    const roles = Claim("roles");

    return (
        <>
            {/* Tab menu */}
            <TabPanel primary="Mina behörigheter" />

            {/* Message */}
            {(schools?.length == 0 && managers?.length == 0) && <Message res={{ color: "warning", msg: `Din roll/roller är ${roles}, men du saknar behörighet att ändra lösenord för annan personal/studenter.`}} />}

            <div className="form-wrapper w-100">
                {schools?.length > 0 && <>
                    <Typography mt={2} variant="h5">Studenter</Typography>
                    <ListView list={schools} avatar={<School />} />
                </>}

                {managers?.length > 0 && <>
                    <Typography mt={3} variant="h5">Personal</Typography>
                    <ListView list={managers} avatar={<MapsHomeWork />} />
                </>}
            </div>
        </>
    )
}

export default Permissions;
