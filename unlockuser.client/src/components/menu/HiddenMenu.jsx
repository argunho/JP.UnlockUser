// Installed
// import { LiveHelp, Logout, Close, FactCheck, Settings, School, WorkHistory, ErrorOutline, BarChart, Home, MenuBook, UploadFile, Info, ForwardToInbox } from '@mui/icons-material';
import { Close } from '@mui/icons-material';
import { IconButton, ClickAwayListener } from '@mui/material';
import { NavLink } from 'react-router-dom';

// Components
import Logotype from '../blocks/Logotype';

// Models
import { Links } from '../../models/Links';

// Css
import '../../assets/css/hidden-menu.css';

function HiddenMenu({ openAccess, onClose }) {

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
                    {(openAccess ? Links : Links.filter(x => !x.access)).map((link, ind) => {
                        return <NavLink
                            key={ind}
                            to={link.url}
                            className={({ isActive }) => `hm-link d-row jc-start w-100 "${isActive ? " active" : ""}${(link?.blink && !sessionStorage.getItem("blinked")) ? " blink-color" : ""}`}>
                            <link.icon /> {link.label}
                        </NavLink>
                    })}
                </div>
            </ClickAwayListener >
        </>

    )
}

export default HiddenMenu;