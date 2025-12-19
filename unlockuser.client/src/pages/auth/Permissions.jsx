// Installed
import { useLoaderData } from 'react-router-dom';

// Components
import TabPanel from './../../components/blocks/TabPanel';
import ListView from '../../components/lists/ListView';

function Permissions() {

    const  { schools , managers } = useLoaderData()

    return (
        <>
            {/* Tab menu */}
            <TabPanel primary="Mina behörigheter" />


            {schools && <ListView list={schools} />}
            {managers && <ListView list={managers} />}

        </>
    )
}

export default Permissions;
