// Installed
import { WrongLocation } from '@mui/icons-material';

// Images
import error from '../../assets/images/error.jpg'

// Css
import '../../assets/css/notfound.css'
import { useLocation } from 'react-router-dom';

function NotFound() {
    NotFound.displayName = "NotFound";

    document.title = "UnlockUser | Ingen result";

    const loc = useLocation();

    return (
        <div className='notfound-container'>
            <img className='notfound-img' src={error} alt={loc.pathname} />
            <div className='notfound-wrapper'>
                <p className='notfound-title'>Sidan kunde inte hittas</p>
                <p className='notfound-url'><WrongLocation /> <span>{window.location.href}</span></p>
            </div>
        </div>
    )
}

export default NotFound;