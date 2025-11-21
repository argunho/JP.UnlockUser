import { useEffect, useRef, useState, use, memo } from 'react';


// Installed
import { LiveHelp, Logout, Menu, Close, History, SettingsApplications, School, WorkHistory, ErrorOutline, BarChart, Home } from '@mui/icons-material';
import { Button, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

// Components
import Logotype from './Logotype';

// Functions
import SessionData from '../../functions/SessionData';
import { DecodedToken } from '../../functions/DecodedToken';

// Storage
import { AuthContext } from '../../storage/AuthContext';

// Css
import '../../assets/css/header.css';


const links = [
    { label: "Hem", url: "/home", icon: <Home />, access: false, hidden: false },
    { label: "Skolor", url: "schools", icon: <School />, access: true, hidden: false },
    { label: "Behöriga användare", url: "employees", icon: <SettingsApplications />, access: true, hidden: false },
    { label: "Session historia", url: "session/history", icon: <History />, access: false, hidden: SessionData("sessionWork")?.length === 0 },
    { label: "Detaljerad historia", url: "logs/history", icon: <WorkHistory />, access: true, hidden: false },
    { label: "Statistik", url: "statistics", icon: <BarChart />, access: true, hidden: false },
    { label: "Loggfiler", url: "logs/errors", icon: <ErrorOutline />, access: true, hidden: false },
    { label: "Kontakta support", url: "contact", icon: <LiveHelp />, access: false, hidden: false },
    { label: "Logga ut", url: "logout", icon: <Logout />, access: false, hidden: false }
];

const Header = memo(function Header() {

    const [open, setOpen] = useState(false);

    const navigate = useNavigate();
    const loc = useLocation();
    const refMenu = useRef();
    const { cleanSession } = use(AuthContext);
    const { Groups, DisplayName, Access } = DecodedToken();


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

    const goToPage = (page) => {
        setOpen((open) => !open);
        cleanSession();
        if (!!page)
            navigate(`/${page}`);
        else
            navigate("/");
    }


    return (
        <header className='header-container w-100 d-column'>
            <section className='header-wrapper wh-100 d-row jc-start' id="logotype">
                <Logotype />
            </section>

            <nav className="nav-wrapper header-nav w-100" id="header-nav">
                <div className='d-row jc-between w-100'>
                    <div className="d-row" id="header-home">
                        <IconButton
                            className={`home-link${loc.pathname === "/" ? " selected" : ""}`}
                            onClick={() => navigate("/")}
                        >
                            <Home />
                        </IconButton>

                        <p className='d-column ai-start'>
                            <span>{DisplayName}</span>
                            <span>{Groups?.replaceAll(",", ", ")}</span>
                        </p>
                    </div>

                    <div className='d-row' id="header-menu">
                        <div className='menu-container'>
                            <Button variant='outlined' size="large" className={`nav-btn ${open && 'nav-btn-active'}`} onClick={() => setOpen((open) => !open)}>
                                {open ? <Close /> : <Menu />}
                            </Button>
                            <ul className={`menu-wrapper ${open && 'visible-menu-wrapper'}`} ref={refMenu}>

                                {/* Loop links */}
                                {(Access ? links : links.filter(x => !x.access)).filter(x => !x?.hidden).map((link, ind) => {
                                    return <li className='d-row w-100 jc-start' key={ind} onClick={() => goToPage(link.url)}>
                                        {link.icon} {link.label}
                                    </li>
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>

        </header>
    )
})

export default Header;
