import { useEffect, useRef, useState, memo } from 'react';


// Installed
import { LiveHelp, Logout, Menu, Close, History, FactCheck, SettingsApplications, School, WorkHistory, ErrorOutline, BarChart, Home } from '@mui/icons-material';
import { Button, IconButton } from '@mui/material';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';

// Components
import Logotype from './Logotype';
import HiddenMenu from './HiddenMenu';

// Functions
import { DecodedClaims } from '../../functions/DecodedToken';

// Css
import '../../assets/css/header.css';


const links = [
    { label: "Hem", url: "/search", icon: <Home />, access: false, hidden: false },
    { label: "Mina behörigheter", url: "/permissions", icon: <FactCheck />, access: false, hidden: false },
    { label: "Skolor", url: "schools", icon: <School />, access: true, hidden: false },
    { label: "Behöriga användare", url: "employees", icon: <SettingsApplications />, access: true, hidden: false },
    { label: "Session historia", url: "session/history", icon: <History />, access: false, hidden: false },
    { label: "Detaljerad historia", url: "logs/history", icon: <WorkHistory />, access: true, hidden: false },
    { label: "Statistik", url: "statistics", icon: <BarChart />, access: true, hidden: false },
    { label: "Loggfiler", url: "logs/errors", icon: <ErrorOutline />, access: true, hidden: false },
    { label: "Kontakta support", url: "contact", icon: <LiveHelp />, access: false, hidden: false },
    { label: "Logga ut", url: "session/logout", icon: <Logout />, access: false, hidden: false }
];

const Header = memo(function Header({ disabled }) {

    const [open, setOpen] = useState(false);

    const navigate = useNavigate();
    const loc = useLocation();
    const refMenu = useRef();
    const { groups: groupsString, displayName, access } = DecodedClaims();
    const groups = JSON.parse(groupsString).map(x => x.Name);
    

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
            <section className='header-wrapper wrapper wh-100 d-row jc-start' id="logotype">
                <Logotype />
            </section>

            <section className="menu-container w-100" id="menu-container">
                <div className='menu-wrapper d-row jc-between'>
                    <div className="d-row" id="header-home">
                        <IconButton
                            className={`home-link${loc.pathname === "/" ? " selected" : ""}`}
                            disabled={disabled}
                            onClick={() => navigate("/")}
                        >
                            <Home />
                        </IconButton>

                        <div className="hml-wrapper">
                            <span>{displayName}</span>
                            <span className="d-row">
                                {access && <Button component={NavLink} 
                                        disabled={disabled}
                                        className="header-link"
                                        to="/search/support"
                                    >Support</Button>}
                                {groups.map((name, ind) => {
                                    return <Button
                                        key={ind}
                                        component={NavLink}
                                        disabled={disabled}
                                        className="header-link"
                                        to={`/search/${name?.toLowerCase()}`}>
                                        {name}
                                    </Button>;
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Navigation button */}
                    <Button
                        variant='outlined'
                        size="large"
                        className={`nav-btn ${open && 'nav-btn-active'}`}
                        disabled={disabled}
                        onClick={() => setOpen((open) => !open)}>
                        {open ? <Close /> : <Menu />}
                    </Button>

                    {/* Hidden menu */}
                    <HiddenMenu
                        open={open}
                        links={access ? links : links.filter(x => !x.access && !x?.hidden)}
                        onClose={() => setOpen(false)} />

                </div>
            </section>
        </header >
    )
})

export default Header;
