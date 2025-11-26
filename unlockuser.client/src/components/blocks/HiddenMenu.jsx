// Installed
import { Close } from '@mui/icons-material';

import { IconButton, ClickAwayListener } from '@mui/material';
import { NavLink } from 'react-router-dom';

// Components
import Logotype from './Logotype';


// Css
import '../../assets/css/hidden-menu.css';

function HiddenMenu({ open, links, onClose }) {

    if (!open)
        return null;

    return (
        <>
            <div className='background fade-in'></div>

            <ClickAwayListener onClickAway={onClose}>
                <div className='hidden-menu w-100 swing-in-right-bck'>

                    {/* Menu header */}
                    <div className='hm-header d-row jc-between w-100'>
                        <Logotype />

                        <IconButton className="close-btn" onClick={onClose}>
                            <Close />
                        </IconButton>
                    </div>

                    {/* Loop links */}
                    {links.filter(x => !x?.hidden).map((link, ind) => {
                        return <NavLink
                            key={ind}
                            to={link.url}
                            className={({ isActive }) => `hm-link d-row jc-start w-100 "${isActive ? " active" : ""}`}>
                            {link.icon} {link.label}
                        </NavLink>
                    })}
                </div>
            </ClickAwayListener >
        </>

    )
}

export default HiddenMenu;