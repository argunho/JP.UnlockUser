
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Installed
import { jwtDecode } from "jwt-decode";
import { HomeSharp, InsertDriveFile, LiveHelp, Logout, Menu, Close, History, SettingsApplications, School } from '@mui/icons-material';
import { Button, Tooltip } from '@mui/material';

// Services
import ApiRequest from '../services/ApiRequest';

// Images
import logo from './../assets/images/logotype.png';

function Header({ authContext }) {

    const [displayName, setDisplayName] = useState("");
    const [linkName, setLinkName] = useState("UnlockUser");
    const [isSupport, setIsSupport] = useState(false);
    const [visibleMenu, setVisibleMenu] = useState(false);

    const navigate = useNavigate();

    let links = [
        { label: "Session historik", url: "history", icon: <History />, access: false },
        { label: "Behöriga användare", url: "employees", icon: <SettingsApplications />, access: true },
        { label: "Loggfiler", url: "logs", icon: <InsertDriveFile />, access: true },
        { label: "Skolor", url: "schools", icon: <School />, access: true },
        { label: "Kontakta support", url: "contact", icon: <LiveHelp />, access: false }
    ];

    if (!isSupport)
        links = links.filter(x => !x.access);

    const refMenu = useRef();

    useEffect(() => {
        let clickHandler = (event) => {
            if (refMenu.current && !refMenu.current?.contains(event.target) && visibleMenu)
                setVisibleMenu(false);
        }

        document.addEventListener("mousedown", clickHandler);
        return () => {
            document.removeEventListener("mousedown", clickHandler);
        }
    })


    // Check current user authentication
    useEffect(() => {
        if (authContext.isAuthorized) {
            const token = sessionStorage.getItem("token");
            if (token !== null && token !== undefined) {
                const decodedToken = jwtDecode(token);

                // If the current user is logged in, the name of the user is visible in the navigation bar
                setDisplayName(decodedToken?.DisplayName);
                setLinkName(`UnlockUser<br/><span>${decodedToken.Groups.replaceAll(",", ", ")}<span/>`);

                setIsSupport(decodedToken?.Roles?.indexOf("Support") > -1);
            }
        }
    }, [authContext.isAuthorized])

    const goToPage = (page) => {
        if (visibleMenu)
            setVisibleMenu(false);
        authContext.cleanSession();
        navigate("/" + page);
    }

    const logout = async () => {
        // If the user is logged out, clear and remove all credential which was saved for the current session
        setVisibleMenu(false);
        await ApiRequest("auth/logout").then(res => {
            if (res.data?.errorMessage)
                console.error("Error response => " + res.data.errorMessage);
        }, error => {
            console.error("Error => " + error?.response)
        })
        setLinkName("UnlockUser");
        authContext.logout();
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
                            <p className='d-column' dangerouslySetInnerHTML={{ __html: linkName }}></p>
                        </Link>
                    </div>

                    {authContext.isAuthorized && <div className='d-flex'>
                        <p className='display-name'>{displayName}</p>
                        <div className='link-menu'>
                            <Button variant='outlined' size="large" className={`nav-btn ${visibleMenu && 'nav-btn-active'}`} onClick={() => setVisibleMenu(!visibleMenu)}>
                                {visibleMenu ? <Close /> : <Menu />}
                            </Button>
                            <ul className={`menu-wrapper ${visibleMenu && 'visible-menu-wrapper'}`} ref={refMenu}>
                                <li className='display-name'>{displayName}</li>
                                {/* Loop links */}
                                {links.map((link, ind) => {
                                    return <li className='d-row' key={ind} onClick={() => goToPage(link.url)}>
                                        {link.icon} {link.label}
                                    </li>
                                })}
                                <li onClick={logout}>
                                    <Logout />&nbsp;&nbsp;<span>Logga ut</span>
                                </li>
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