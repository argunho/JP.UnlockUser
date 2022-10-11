
import React, { useEffect, useRef, useState } from 'react'
import { Link, useHistory } from 'react-router-dom';
import jwt_decode from "jwt-decode";
import { HomeSharp, InsertDriveFile, LiveHelp, Logout, Menu, Close, PasswordOutlined } from '@mui/icons-material';
import { Button, Tooltip } from '@mui/material';
import logo from './../../images/logotype.png'
import axios from 'axios';
import SessionWork from '../functions/SessionWork';

export default function Header({ isAuthorized }) {

    const history = useHistory();
    const [displayName, setDisplayName] = useState("");
    const [linkName, setLinkName] = useState("UnlockUser");
    const [isSupport, setIsSupport] = useState(false);
    const [visibleMenu, setVisibleMenu] = useState(false);
    const [work, setWork] = useState(false);

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
                setLinkName(linkName + " | " + decodedToken.Group);
                setIsSupport(decodedToken?.Support === "Ok");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthorized])

    useEffect(() => {
        document.title = linkName;
    }, [linkName])

    useEffect(() => {
        console.log(SessionWork())
        setWork(SessionWork().Length > 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionStorage.getItem("sessionWork")])

    const goToPage = (page) => {
        if (visibleMenu) setVisibleMenu(false);
        history.push("/" + page);
    }

    const logout = async () => {
        // If the user is logged out, clear and remove all credential which was saved for the current session
        sessionStorage.clear();
        localStorage.removeItem("blockTime");
        sessionStorage.setItem("login", "true");
        await axios.get("auth/logout").then(res => {
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
                        <Link className="link" to="/find-user">
                            <HomeSharp />
                            <span>{linkName}</span>
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
                                {isSupport && <li onClick={() => goToPage("logfiles")}>
                                    <InsertDriveFile />&nbsp;&nbsp;<span>Loggfiler</span>
                                </li>}
                               {work && <li onClick={() => goToPage("contact")}>
                                    <PasswordOutlined />&nbsp;&nbsp;<span>Ändrade lösenords</span>
                                </li>}
                                <li onClick={() => goToPage("contact")}>
                                    <LiveHelp />&nbsp;&nbsp;<span>Kontakta support</span>
                                </li>
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
