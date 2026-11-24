import { useEffect, useRef, useState, memo, use, useCallback } from 'react'; // 2026-11-24 12:01

// Installed
import { Menu, Close, Home, AssignmentReturnOutlined, Construction } from '@mui/icons-material';
import { Button, IconButton, Tooltip } from '@mui/material';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';

// Components
import Logotype from './Logotype';
import HiddenMenu from '../menu/HiddenMenu';

// Functions
import { DecodedClaims } from '../../functions/DecodedToken';

// Storage
import { FetchContext } from '../../storage/FetchContext'; // 2026-09-08
import { AuthContext } from '../../storage/AuthContext'; // 2026-09-08

// Css
import '../../assets/css/header.css';

const Header = memo(function Header({ disabled, supportMode }) {

    const [openMenu, setOpenMenu] = useState(false);
    const [openDevTeamMenu, setOpenDevTeamMenu] = useState(false);
    const [closingMenu, setClosingMenu] = useState(false); // 2026-11-24 12:01 - true while the hidden menu plays its slide-out animation

    const navigate = useNavigate();
    const loc = useLocation();
    const refMenu = useRef();
    const { permissions, displayName, openAccess, limitedAccess, roles, impersonating } = DecodedClaims();
 
    const groups = permissions != null ? permissions?.split(",").filter(x => x.trim() !== "") : [];
    const access = openAccess || limitedAccess ?
        {
            open: openAccess,
            limited: limitedAccess,
            develop: roles.includes("DevelopTeam")
        } : null;

    // start: 2026-09-08
    const { fetchData } = use(FetchContext);
    const { authorize } = use(AuthContext);

    async function resetLoginAs() {
        const res = await fetchData({ api: "authentication/reset-login-as", method: "post", action: "return" }) ?? {};
        // const { token, groupName } = res;
        const { token } = res;

        if (token) {
            authorize(token);
            navigate(`/`);
        }
    }
    // end

    useEffect(() => {
        let clickHandler = (event) => {
            if (refMenu.current && !refMenu.current?.contains(event.target) && openMenu)
                setOpenMenu(false);
        }

        document.addEventListener("mousedown", clickHandler);
        return () => {
            document.removeEventListener("mousedown", clickHandler);
        }
    })

    // start: 2026-11-24 12:01
    const menuIsOpen = openMenu || openDevTeamMenu;

    useEffect(() => {
        if (menuIsOpen)
            setClosingMenu(true);
    }, [loc])

    // Lock page scroll while the hidden menu is open, regardless of how it was opened/closed
    useEffect(() => {
        document.getElementById("root")?.classList.toggle("hide-overflow", menuIsOpen);
    }, [menuIsOpen])

    // Start the slide-out animation, HiddenMenu calls handleOpenMenu when it is finished
    function closeMenu() {
        if (menuIsOpen)
            setClosingMenu(true);
    }

    // Toggle one of the menus, an open menu is always closed with the animation first
    function toggleMenu(setOpen) {
        if (menuIsOpen)
            closeMenu();
        else
            setOpen(true);
    }

    const handleOpenMenu = useCallback(() => {
        setClosingMenu(false);
        setOpenDevTeamMenu(false)
        setOpenMenu((open) => {
            // The blinking links are only shown in the main menu
            if (open && !sessionStorage.getItem("blinked"))
                sessionStorage.setItem("blinked", "ok");
            return false;
        });
    }, [])
    // end

    const switchMenuColor = loc.pathname.toLowerCase().includes("overview") || supportMode;
    const link = `/search/${(groups?.length > 0 ? groups[0] : "overview")?.toLowerCase()}`;

    return (
        <header className='header-container w-100 d-column'>
            <section className='header-wrapper d-row jc-start w-100' id="logotype">
                <Logotype link={link} />
            </section>

            <section className={`menu-container${switchMenuColor ? " support-view" : ""} w-100`} id="menu-container">
                <div className='menu-wrapper d-row jc-between'>
                    <div className="d-row" id="header-home">
                        <IconButton
                            className={`home-link${loc.pathname === "/" ? " selected" : ""}`}
                            disabled={disabled}
                            onClick={() => navigate(link)}
                        >
                            <Home />
                        </IconButton>

                        <div className="hml-wrapper">
                            <span>{displayName}</span>

                            {/* Menu */}
                            <span className="d-row jc-start">
                                {/* Support */}
                                {access && <Button component={NavLink}
                                    disabled={disabled}
                                    className="header-link"
                                    to="/search/overview"
                                >Översikt</Button>}

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

                    <div className="d-row">
                        {/* start: 2026-09-08 */}
                        {/* Return to the developer's own account after viewing as another moderator */}
                        {impersonating && <Tooltip title="" arrow>
                            <Button
                                className="reset-impersonation-btn"
                                disabled={disabled}
                                startIcon={<AssignmentReturnOutlined />}
                                onClick={resetLoginAs}>
                                Återgå till mitt konto
                            </Button>
                        </Tooltip>}
                        {/* end */}

                        {/* Navigation develop group button */}
                        {/* start: 2026-11-24 12:01 */}
                        {access?.develop && <IconButton
                            variant='outlined'
                            size="large"
                            disabled={disabled}
                            className="nav-btn-develop"
                            sx={{ marginRight: "30px" }}
                            onClick={() => toggleMenu(setOpenDevTeamMenu)}>
                            {openDevTeamMenu ? <Close /> : <Construction /> }
                        </IconButton>}

                        {/* Navigation button */}
                        <Button
                            variant='outlined'
                            size="large"
                            className={`nav-btn ${openMenu && 'nav-btn-active'}`}
                            disabled={disabled}
                            onClick={() => toggleMenu(setOpenMenu)}>
                            {openMenu ? <Close /> : <Menu />}
                        </Button>

                        {/* Hidden menu */}
                        {menuIsOpen && <HiddenMenu
                            access={access}
                            developTeam={openDevTeamMenu}
                            closing={closingMenu}
                            onClose={closeMenu}
                            onClosed={handleOpenMenu} />}
                        {/* end */}
                    </div>


                </div>
            </section>
        </header>
    )
})

export default Header;
