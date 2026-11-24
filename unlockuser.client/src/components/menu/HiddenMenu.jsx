import { use, useEffect } from 'react'; // 2026-11-24 12:01

// Installed
import { Close, Construction } from '@mui/icons-material'; // 2026-11-24 12:01
import { IconButton, ClickAwayListener, Button } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';

// Components
import Logotype from '../blocks/Logotype';

// Models
import { Links } from '../../models/Links';

// Functions
// import { DecodedClaims } from '../../functions/DecodedToken'; // 2026-10-19

// Storage
import { FetchContext } from './../../storage/FetchContext';
import { AuthContext } from './../../storage/AuthContext';

// Css
import '../../assets/css/hidden-menu.css';

// start: 2026-11-24 12:01
// Must match the duration of the .hidden-menu.closing animation in hidden-menu.css
const closeAnimationMs = 600;
// end

function HiddenMenu({ access, developTeam, closing, onClose, onClosed }) { // 2026-11-24 12:01

    const { fetchData } = use(FetchContext);
    const { authorize } = use(AuthContext);

    const navigate = useNavigate();

    // start: 2026-11-24 12:01
    // Let the slide-out animation finish before the menu is unmounted
    useEffect(() => {
        if (!closing) return;
        const timer = setTimeout(onClosed, closeAnimationMs);
        return () => clearTimeout(timer);
    }, [closing, onClosed])
    // end
    // const developer = DecodedClaims()?.roles?.split(",").includes("DevelopTeam"); // 2026-10-19

    async function switchModerator() {
        const res = await fetchData({ api: `authentication/login-as/kc-group`, method: "post", action: "return" }) ?? {};
        const { token } = res;

        if (token) {
            authorize(token);
            navigate(`/search/overview`);
        }
    }

    return (
        <>
            <div className={`background ${closing ? "fade-out" : "fade-in"}`}></div> {/* 2026-11-24 12:01 */}

            <ClickAwayListener onClickAway={onClose}>
                {/* start: 2026-11-24 12:01 */}
                <div className={`hidden-menu w-100${closing ? " closing" : " swing-in-right-bck"}${developTeam ? " hidden-menu-dev" : ""}`}>
                {/* end */}

                    {/* Menu header */}
                    <div className='hm-header d-row jc-between w-100'>
                        <Logotype />

                        <IconButton className="close-btn" onClick={onClose}>
                            <Close />
                        </IconButton>
                    </div>
                    <div className="hm-links-wrapper">
                        {/* start: 2026-11-24 12:01 */}
                        {developTeam && <div className="hm-dev-title d-row jc-start">
                            <Construction /> Utvecklingsteam
                        </div>}
                        {/* end */}

                        {/* Loop links */}
                        {(developTeam ? Links.filter(x => x.developTeam)
                            : (access?.open ? Links.filter(x => !x.developTeam)
                                : ((access?.limited ? Links.filter(x => !x.permission)
                                    : Links.filter(x => !x.access))))).map((link, ind) => { // 2026-10-19

                                        const props = link?.url ? { to: link.url } : { component: Button, onClick: switchModerator };

                                        return <NavLink
                                            key={ind}
                                            {...props}
                                            className={({ isActive }) => `hm-link d-row jc-start w-100${link?.developTeam ? " hm-link-dev" : ""}${(isActive && link?.url) ? " active" : ""}${(link?.blink && !sessionStorage.getItem("blinked")) ? " blink-color" : ""}`}> {/* 2026-11-24 12:01 */}
                                            <link.icon color={link?.color} /> {link.label}
                                        </NavLink>
                                    })}
                    </div>
                </div>
            </ClickAwayListener >
        </>

    )
}

export default HiddenMenu;