// Installed
import { useLoaderData } from 'react-router-dom';
import { School, MapsHomeWork } from '@mui/icons-material';

// Components
import TabPanel from './../../components/blocks/TabPanel';
import ListView from '../../components/lists/ListView';


function Permissions() {

    const { schools, managers } = useLoaderData()

    return (
        <>
            {/* Tab menu */}
            <TabPanel primary="Mina behörigheter" />

            {/* Students */}
            {schools && <ListView list={schools} avatar={<School />} />}

            {/* Employees */}
            {managers && <ListView list={managers} avatar={<MapsHomeWork />} />}

        </>
    )
}

export default Permissions;
