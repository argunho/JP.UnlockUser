
import React, { useEffect, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

// Installed
import jwt_decode from "jwt-decode";
import { HomeSharp, InsertDriveFile, LiveHelp, Logout, Menu, Close, History, SettingsApplications } from '@mui/icons-material';
import { Button, Tooltip } from '@mui/material';

// Services
import ApiRequest from '../services/ApiRequest';

// Images
import logo from './../assets/images/logotype.png';

function Header({ isAuthorized }) {

    const history = useHistory();
    const [displayName, setDisplayName] = useState("");
    const [linkName, setLinkName] = useState("UnlockUser");
    const [isSupport, setIsSupport] = useState(false);
    const [visibleMenu, setVisibleMenu] = useState(false);
    
    const links = [
        { label: "Session historik", url: "history", icon: <History />, access: isSupport || isSupport},
        { label: "Behöriga användare", url: "members", icon: <SettingsApplications/>, access: isSupport},
        { label: "Loggfiler", url: "logs", icon: <InsertDriveFile />, access: isSupport},
        { label: "Kontakta support", url: "contact", icon: <LiveHelp />, access: !isSupport || isSupport}
    ].filter(x => x.access === isSupport);

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
        if (isAuthorized) {
            const token = sessionStorage.getItem("token");
            if (token !== null && token !== undefined) {
                const decodedToken = jwt_decode(token);
                // If the current user is logged in, the name of the user is visible in the navigation bar
                setDisplayName(decodedToken?.DisplayName);
                setLinkName(`UnlockUser<br/><span>${decodedToken.Groups.replaceAll(",", ", ")}<span/>`);
                console.log(decodedToken)
                setIsSupport(decodedToken?.Roles?.indexOf("Support") > -1);
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthorized])

    const goToPage = (page) => {
        if (visibleMenu) setVisibleMenu(false);
        history.push("/" + page);
    }

    const logout = async () => {
        // If the user is logged out, clear and remove all credential which was saved for the current session

        sessionStorage.removeItem("token");      

        setVisibleMenu(false);
        await ApiRequest("auth/logout").then(res => {
            if (res.data?.errorMessage)
                console.error("Error response => " + res.data.errorMessage);
        }, error => {
            console.error("Error => " + error?.response)
        })
        setLinkName("UnlockUser");
        history.push("/login");
    }

    return (
        <header>
            <div className="logo-wrapper container">
                <Link className="logo" to="/">
                    <img alt="Alvesta Kommun" src={logo} />
                </Link>
            </div>
            <nav className="nav-wrapper">
                <ul className='container'>
                    <li className="link-home">
                        <Link className="link link-logo d-row" to="/find-user">
                            <HomeSharp />
                            <p className='d-column' dangerouslySetInnerHTML={{__html: linkName}}></p>
                        </Link>
                    </li>
                    {isAuthorized && <>
                        <li className='display-name'>{displayName}</li>
                        <li className='link-menu'>
                            <Button variant='outlined' size="large" className={`nav-btn ${visibleMenu && 'nav-btn-active'}`} onClick={() => setVisibleMenu(!visibleMenu)}>
                                {visibleMenu ? <Close /> : <Menu />}
                            </Button>
                            <ul className={`menu-wrapper ${visibleMenu && 'visible-menu-wrapper'}`} ref={refMenu}>
                                <li className='display-name'>{displayName}</li>
                                {/* Loop links */}
                                {links.map((link, ind) => {
                                    return <li className='d-row' onClick={() => goToPage(link.url)}>
                                        {link.icon} {link.label}
                                    </li>
                                })}
                                <li onClick={() => logout()}>
                                    <Logout />&nbsp;&nbsp;<span>Logga ut</span>
                                </li>
                            </ul>
                        </li>
                    </>}

                    {!isAuthorized &&
                        <li className='link'>
                            <Tooltip arrow title="Kontakta support"
                                classes={{ tooltip: "tooltip tooltip-margin" }}>
                                <Button variant='outlined' size="large" className='nav-btn' onClick={() => history.push("/contact")}>
                                    <LiveHelp />
                                </Button>
                            </Tooltip>
                        </li>}
                </ul>
            </nav>
        </header>
    )
}

export default Header;