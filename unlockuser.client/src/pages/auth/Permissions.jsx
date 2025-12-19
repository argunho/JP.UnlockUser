// Installed
import { useLoaderData } from 'react-router-dom';
import { School, MapsHomeWork } from '@mui/icons-material';
import { Typography } from '@mui/material';

// Components
import TabPanel from './../../components/blocks/TabPanel';
import ListView from '../../components/lists/ListView';


function Permissions() {

    const { groups, schools, managers } = useLoaderData()

    return (
        <>
            {/* Tab menu */}
            <TabPanel primary="Mina behörigheter" />

            <div className="form-wrapper w-100">
                {schools && <>
                    <Typography mt={2} variant="h5">Studenter</Typography>
                    <ListView list={schools} avatar={<School />} />
                </>}

                {managers && <>
                    <Typography mt={3} variant="h5">Personal</Typography>
                    <ListView list={managers} avatar={<MapsHomeWork />} />
                </>}
            </div>
        </>
    )
}

export default Permissions;
