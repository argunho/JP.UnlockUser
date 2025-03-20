import { useLocation, useNavigate } from 'react-router-dom';

// Installed
import { WrongLocation } from '@mui/icons-material';

// Images
import image from '../../assets/images/notfound.jpg'

// Css
import '../../assets/css/notfound.css'

function NotFound() {
    NotFound.displayName = "NotFound";

    document.title = "UnlockUser | Ingen result";

    const loc = useLocation();
    const navigate = useNavigate();

    if(loc.pathname === "/logout")
        navigate("/");

    return (
        <div className='d-column notfound-container'>
            <div className="img-wrapper">
                <img className='notfound-img' src={image} alt={loc.pathname} />
                <div className='notfound-wrapper'>
                    <p className='notfound-title'>Sidan kunde inte hittas</p>
                    <p className='notfound-url'><WrongLocation /> <span>{window.location.href}</span></p>
                </div>
            </div>
        </div>
    )
}

export default NotFound;