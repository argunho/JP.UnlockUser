import { useEffect, useRef, useState, use, memo } from 'react';


// Installed
import { HomeSharp, LiveHelp, Logout, Menu, Close, History, SettingsApplications, School, WorkHistory, ErrorOutline, BarChart, Home } from '@mui/icons-material';
import { Button, IconButton } from '@mui/material';
import { useNavigate, Link, useLocation } from 'react-router-dom';

// Components
import Logotype from './Logotype';

// Functions
import SessionData from '../functions/SessionData';
import { DecodedToken } from '../functions/DecodedToken';

// Storage
import { AuthContext } from '../storage/AuthContext';

// Css
import '../assets/css/header.css';


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

            <nav className="nav-wrapper menu-container w-100" id="menu-container">
                <div className='d-row jc-between w-100'>
                    {/* <div className="d-flex">
  
                    </div> */}

                    {/* <Link className="link link-logo d-row" to="/"> */}
                    <div className="d-row">
                        <IconButton
                            className={`menu-link${loc.pathname === "/" ? " selected" : ""}`}
                            onClick={() => navigate("/")}
                        >
                            <Home />
                        </IconButton>
                        {/* <HomeSharp /> */}
                        <p className='d-column ai-start'>
                            <span>UnlockUser</span>
                            <span>{Groups?.replaceAll(",", ", ")}</span>
                        </p>
                    </div>
                    {/* </Link> */}

                    <div className='d-row' id="header-menu">
                        <p className='display-name'>{DisplayName}</p>
                        <div className='link-menu'>
                            <Button variant='outlined' size="large" className={`nav-btn ${open && 'nav-btn-active'}`} onClick={() => setOpen((open) => !open)}>
                                {open ? <Close /> : <Menu />}
                            </Button>
                            <ul className={`menu-wrapper ${open && 'visible-menu-wrapper'}`} ref={refMenu}>
                                <li className='display-name'>{DisplayName}</li>

                                {/* Loop links */}
                                {(Access ? links : links.filter(x => !x.access)).filter(x => !x?.hidden).map((link, ind) => {
                                    return <li className='d-row' key={ind} onClick={() => goToPage(link.url)}>
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
// <section className="menu-container w-100" id="menu-container">
//     {/* Menu */}
//     <div className='menu-wrapper d-row jc-end ai-end'>
//         {links.map((link, index) => {
//             return <div key={index} className="d-row menu-buttons" id={link.url}>
//                 <IconButton
//                     className={`menu-link${loc.pathname === link.url ? " selected" : ""}`}
//                     style={{ color: link.color }}
//                     onClick={() => navigate(link?.url)}
//                 >
//                     {link.icon}
//                 </IconButton>
//             </div>;
//         })}
//     </div>
// </section>