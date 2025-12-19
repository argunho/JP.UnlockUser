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

            {groups.map((group) => {
                const isSchool = (group.toLowerCase() === "studenter");
                return <div key={group} className="d-row jc-start w-100">
                    <Typography component="h4">{group}</Typography>

                    <ListView list={isSchool ? schools : managers} avatar={isSchool ? <School /> : <MapsHomeWork />} />
                </div>
            })}
        </>
    )
}

export default Permissions;
