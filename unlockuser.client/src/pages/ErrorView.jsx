import { useState,  useEffect } from 'react';

// Installed
import { useRouteError, NavLink } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';

// Css
import '../assets/css/error.css';

function ErrorView() {

    const [delay, setDelay] = useState(true);
    const error = useRouteError();

    useEffect(() => {
        document.title = "AlvAssets | Error";

        const timer = setTimeout(() => {
            setDelay(false);
        }, 1000)

        return () => {
            clearTimeout(timer);
        }
    }, [])

    if(delay)
        return null;

    return (
        <div className="error-wrapper d-column jc-around fade-in">
            <p className="error-status w-100">Fel {error?.status}</p>

            <div className="error-msg-wrapper">
                <p className='error-title'>
                    Något har got snett
                </p>
                <span className='error-title'>
                    {error?.message}
                </span>
            </div>

            <NavLink to={-1} className='error-link d-row jc-between'>
                <ArrowBack /> Tillbaka
            </NavLink>
        </div>
    )
}

export default ErrorView;
