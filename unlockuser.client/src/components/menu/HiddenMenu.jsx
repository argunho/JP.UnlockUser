// Installed
import { LiveHelp, Logout, Close, FactCheck, Settings, School, WorkHistory, ErrorOutline, BarChart, Home, MenuBook, Info } from '@mui/icons-material';
import { IconButton, ClickAwayListener } from '@mui/material';
import { NavLink } from 'react-router-dom';

// Components
import Logotype from '../blocks/Logotype';

// Css
import '../../assets/css/hidden-menu.css';


const links = [
    { label: "Hem", url: "/search", icon: <Home />, access: false },
    { label: "Mina behörigheter", url: "/view/my/permissions", icon: <FactCheck />, access: false },
    { label: "Webapp-manual", url: "/web/manual", icon: <MenuBook />, access: true, blink: true },
    { label: "Informations artiklar", url: "/web/articles", icon: <Info />, access: false, blink: true },
    { label: "Behöriga användare", url: "/moderators", icon: <Settings />, access: true },
    { label: "Skolor", url: "/catalog/schools", icon: <School />, access: true },
    { label: "Statistik", url: "/catalog/statistics", icon: <BarChart />, access: true },
    { label: "Historik", url: "/catalog/history", icon: <WorkHistory />, access: true },
    { label: "Loggfiler", url: "/catalog/errors", icon: <ErrorOutline />, access: true },
    { label: "Kontakta support", url: "/contact", icon: <LiveHelp />, access: false },
    { label: "Logga ut", url: "/session/logout", icon: <Logout />, access: false }
];

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
                    {(openAccess ? links : links.filter(x => !x.access)).map((link, ind) => {
                        return <NavLink
                            key={ind}
                            to={link.url}
                            className={({ isActive }) => `hm-link d-row jc-start w-100 "${isActive ? " active" : ""}${(link?.blink && !sessionStorage.getItem("blinked")) ? " blink-color" : ""}`}>
                            {link.icon} {link.label}
                        </NavLink>
                    })}
                </div>
            </ClickAwayListener >
        </>

    )
}

export default HiddenMenu;