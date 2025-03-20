
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Installed
import { HomeSharp, LiveHelp, Logout, Menu, Close, History, SettingsApplications, School, WorkHistory, ErrorOutline, BarChart, Home } from '@mui/icons-material';
import { Button, Tooltip } from '@mui/material';

// Functions
import SessionData from '../functions/SessionData';
import { DecodedToken } from '../functions/DecodedToken';

// Images
import logo from './../assets/images/logotype.png';

function Header({ authContext }) {

    const [displayName, setDisplayName] = useState("");
    const [isSupport, setIsSupport] = useState(false);
    const [open, setOpen] = useState(false);

    const navigate = useNavigate();
    const decodedToken = DecodedToken();

    let links = [
        { label: "Hem", url: null, icon: <Home />, access: false, hidden: false },
        { label: "Skolor", url: "schools", icon: <School />, access: true, hidden: false },
        { label: "Behöriga användare", url: "employees", icon: <SettingsApplications />, access: true, hidden: false },
        { label: "Session historia", url: "session/history", icon: <History />, access: false, hidden: SessionData("sessionWork")?.length === 0 },
        { label: "Detaljerad historia", url: "logs/history", icon: <WorkHistory />, access: true, hidden: false },
        { label: "Statistik", url: "statistics", icon: <BarChart />, access: true, hidden: false },
        { label: "Loggfiler", url: "logs/errors", icon: <ErrorOutline />, access: true, hidden: false },
        { label: "Kontakta support", url: "contact", icon: <LiveHelp />, access: false, hidden: false },
        { label: "Logga ut", url: "logout", icon: <Logout />, access: false, hidden: false }
    ];

    if (!isSupport)
        links = links.filter(x => !x.access);

    const refMenu = useRef();

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

    // Check current user authentication
    useEffect(() => {
        if (authContext.isAuthorized) {

            // If the current user is logged in, the name of the user is visible in the navigation bar
            setDisplayName(decodedToken?.DisplayName);
            setIsSupport(decodedToken?.Roles?.indexOf("Support") > -1);
        }
    }, [authContext.isAuthorized])

    const goToPage = (page) => {
        setOpen((open) => !open);
        authContext.cleanSession();
        if (!!page)
            navigate(`/${page}`);
        else
            navigate("/");
    }

    return (
        <header>
            <div className="logo-wrapper container">
                <Link className="logo" to="/">
                    <img alt="Alvesta Kommun" src={logo} />
                </Link>
            </div>
            <nav className="nav-wrapper">
                <div className='d-flex w-100'>
                    <div className="d-flex">
                        <Link className="link link-logo d-row" to="/">
                            <HomeSharp />
                            <p className='d-column'>
                                <span>UnlockUser</span>
                                <span>{decodedToken?.Groups?.replaceAll(",", ", ")}</span>
                            </p>
                        </Link>
                    </div>

                    {authContext.isAuthorized && <div className='d-flex'>
                        <p className='display-name'>{displayName}</p>
                        <div className='link-menu'>
                            <Button variant='outlined' size="large" className={`nav-btn ${open && 'nav-btn-active'}`} onClick={() => setOpen((open) => !open)}>
                                {open ? <Close /> : <Menu />}
                            </Button>
                            <ul className={`menu-wrapper ${open && 'visible-menu-wrapper'}`} ref={refMenu}>
                                <li className='display-name'>{displayName}</li>
                                {/* Loop links */}
                                {links.filter(x => !x?.hidden).map((link, ind) => {
                                    return <li className='d-row' key={ind} onClick={() => goToPage(link.url)}>
                                        {link.icon} {link.label}
                                    </li>
                                })}
                            </ul>
                        </div>
                    </div>}

                    {!authContext.isAuthorized && <Tooltip arrow title="Kontakta support"
                        classes={{ tooltip: "tooltip tooltip-margin" }}>
                        <Button variant='outlined' size="large" className='nav-btn' onClick={() => navigate("/contact")}>
                            <LiveHelp />
                        </Button>
                    </Tooltip>}

                </div>
            </nav>
        </header>
    )
}

export default Header;