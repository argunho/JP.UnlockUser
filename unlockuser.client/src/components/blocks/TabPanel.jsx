


// Installed
import { IconButton, Avatar } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Functions
import { Initials } from '../../functions/Helpers';


function TabPanel({ children, primary, secondary, initialsView }) {

    const navigate = useNavigate();

    
    const initials = initialsView ? Initials(primary) : null;

    return <div className="d-row jc-between menu-div w-100">

        {/* Welcome title */}
        <div className="label-wrapper d-row jc-start">
            {initials && <Avatar className="profile-avatar">{initials}</Avatar>}
            <p className="d-column ai-start">
                {primary}
                {secondary && <>
                    {typeof secondary === "string"
                        ? <span dangerouslySetInnerHTML={{ __html: secondary }}></span>
                        : <span className="d-row">{secondary}</span>
                    }
                </>}
            </p>
        </div>

        {/* Actions buttons */}
        <div className="d-row">

            {children}

            <IconButton className="nav-back" onClick={() => navigate(-1)}>
                <ArrowBack />
            </IconButton>
        </div>
    </div>
}

export default TabPanel
