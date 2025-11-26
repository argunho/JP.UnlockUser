import { useEffect, useRef, useState, memo } from 'react';


// Installed
import { LiveHelp, Logout, Menu, Close, History, SettingsApplications, School, WorkHistory, ErrorOutline, BarChart, Home } from '@mui/icons-material';
import { Button, IconButton } from '@mui/material';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';

// Components
import Logotype from './Logotype';

// Functions
import SessionData from '../../functions/SessionData';
import { DecodedClaims } from '../../functions/DecodedToken';

// Css
import '../../assets/css/header.css';
import HiddenMenu from './HiddenMenu';


const links = [
    { label: "Hem", url: "/search", icon: <Home />, access: false, hidden: false },
    { label: "Skolor", url: "schools", icon: <School />, access: true, hidden: false },
    { label: "Behöriga användare", url: "employees", icon: <SettingsApplications />, access: true, hidden: false },
    { label: "Session historia", url: "session/history", icon: <History />, access: false, hidden: SessionData("sessionWork")?.length === 0 },
    { label: "Detaljerad historia", url: "logs/history", icon: <WorkHistory />, access: true, hidden: false },
    { label: "Statistik", url: "statistics", icon: <BarChart />, access: true, hidden: false },
    { label: "Loggfiler", url: "logs/errors", icon: <ErrorOutline />, access: true, hidden: false },
    { label: "Kontakta support", url: "contact", icon: <LiveHelp />, access: false, hidden: false },
    { label: "Logga ut", url: "session/logout", icon: <Logout />, access: false, hidden: false }
];

const Header = memo(function Header() {

    const [open, setOpen] = useState(false);

    const navigate = useNavigate();
    const loc = useLocation();
    const refMenu = useRef();
    const { groups: groupsString, displayName, access } = DecodedClaims();
    const groups = JSON.parse(groupsString).map(x => x.Name);
    console.log(DecodedClaims())

    useEffect(() => {
        let clickHandler = (event) => {
            if (refMenu.current && !refMenu.current?.contains(event.target) && open)
                setOpen(false);
        }

        document.addEventListener("mousedown", clickHandler);
        return () => {
            document.removeEventListener("mousedown", clickHandler);
        }
    })

    useEffect(() => {
        if (open)
            setOpen(false);
    }, [loc])

    return (
        <header className='header-container w-100 d-column'>
            <section className='header-wrapper wh-100 d-row jc-start' id="logotype">
                <Logotype />
            </section>

            <section className="menu-container w-100" id="menu-container">
                <div className='menu-wrapper d-row jc-between'>
                    <div className="d-row" id="header-home">
                        <IconButton
                            className={`home-link${loc.pathname === "/" ? " selected" : ""}`}
                            onClick={() => navigate("/")}
                        >
                            <Home />
                        </IconButton>

                        <p className='d-column ai-start'>
                            <span>{displayName}</span>
                            <span>{groups.join(", ")}</span>
                        </p>
                    </div>

                    {/* Navigation button */}
                    <Button variant='outlined' size="large" className={`nav-btn ${open && 'nav-btn-active'}`} onClick={() => setOpen((open) => !open)}>
                        {open ? <Close /> : <Menu />}
                    </Button>

                    {/* Hidden menu */}
                    {access && <HiddenMenu open={open} links={links} onClose={() => setOpen(false)} />}

                    {/* Navigation hidden menu */}
                    {!access && <div key={loc} className={`nav-wrapper${open ? ' visible' : ""}`} ref={refMenu}>

                        {/* Loop links */}
                        {links.filter(x => !x.access && !x?.hidden).map((link, ind) => {
                            return <NavLink className={({ isActive }) => `d-row w-100 jc-start${isActive ? " active" : ""}`} key={ind} to={link.url}>
                                {link.icon} {link.label}
                            </NavLink>
                        })}
                    </div>}
                </div>
            </section>
        </header >
    )
})

export default Header;
