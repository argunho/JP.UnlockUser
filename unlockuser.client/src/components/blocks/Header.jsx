import { useEffect, useRef, useState, memo } from 'react';

// Installed
import { Menu, Close, Home } from '@mui/icons-material';
import { Button, IconButton } from '@mui/material';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';

// Components
import Logotype from './Logotype';
import HiddenMenu from '../menu/HiddenMenu';

// Functions
import { DecodedClaims } from '../../functions/DecodedToken';

// Css
import '../../assets/css/header.css';


const Header = memo(function Header({ disabled, supportMode }) {

    const [open, setOpen] = useState(false);

    const navigate = useNavigate();
    const loc = useLocation();
    const refMenu = useRef();
    const { permissions, displayName, openAccess } = DecodedClaims();
    const groups = permissions != null ? permissions?.split(",") : [];

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

    function handleOpenMenu(){
        setOpen((open) => !open);
        
        if(open && !sessionStorage.getItem("blinked"))
            sessionStorage.setItem("blinked", "ok");
    }

    const switchMenuColor = loc.pathname.toLowerCase().includes("support") || supportMode;

    return (
        <header className='header-container w-100 d-column'>
            <section className='header-wrapper d-row jc-start w-100' id="logotype">
                <Logotype />
            </section>

            <section className={`menu-container${switchMenuColor ? " support-view" : ""} w-100`} id="menu-container">
                <div className='menu-wrapper d-row jc-between'>
                    <div className="d-row" id="header-home">
                        <IconButton
                            className={`home-link${loc.pathname === "/" ? " selected" : ""}`}
                            disabled={disabled}
                            onClick={() => navigate(`/search/${groups[0]?.toLowerCase()}`)}
                        >
                            <Home />
                        </IconButton>

                        <div className="hml-wrapper">
                            <span>{displayName}</span>

                            {/* Menu */}
                            <span className="d-row">
                                {/* Support */}
                                {openAccess && <Button component={NavLink}
                                    disabled={disabled}
                                    className="header-link"
                                    to="/search/support"
                                >Support</Button>}

                                {/* Groups */}
                                {groups?.map((name, ind) => {
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
                   {open && <HiddenMenu
                        openAccess={openAccess}
                        onClose={handleOpenMenu} />}

                </div>
            </section>
        </header>
    )
})

export default Header;
