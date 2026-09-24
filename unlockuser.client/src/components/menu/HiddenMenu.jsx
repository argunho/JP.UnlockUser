import { use } from 'react';

// Installed
import { Close } from '@mui/icons-material';
import { IconButton, ClickAwayListener, Button } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';

// Components
import Logotype from '../blocks/Logotype';

// Models
import { Links } from '../../models/Links';

// Storage
import { FetchContext } from './../../storage/FetchContext';
import { AuthContext } from './../../storage/AuthContext';

// Css
import '../../assets/css/hidden-menu.css';

function HiddenMenu({ access, onClose }) {

    const { fetchData } = use(FetchContext);
    const { authorize } = use(AuthContext);

    const navigate = useNavigate();

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
            <div className='background fade-in'></div>

            <ClickAwayListener onClickAway={onClose}>
                <div className='hidden-menu w-100 swing-in-right-bck'>

                    {/* Menu header */}
                    <div className='hm-header d-row jc-between w-100'>
                        <Logotype />

                        <IconButton className="close-btn" onClick={onClose}>
                            <Close />
                        </IconButton>
                    </div>

                    {/* Loop links */}
                    {(access?.open ? Links : (access?.limited ? Links.filter(x => !x.permission) : Links.filter(x => !x.access))).map((link, ind) => {

                        const props = link?.url ? { to: link.url } : { component: Button, onClick: switchModerator };

                        return <NavLink
                            key={ind}
                            {...props}
                            className={({ isActive }) => `hm-link d-row jc-start w-100 "${(isActive && link?.url) ? " active" : ""}${(link?.blink && !sessionStorage.getItem("blinked")) ? " blink-color" : ""}`}>
                            <link.icon /> {link.label}
                        </NavLink>
                    })}
                </div>
            </ClickAwayListener >
        </>

    )
}

export default HiddenMenu;