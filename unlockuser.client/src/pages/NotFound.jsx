import { useEffect, useState } from 'react';

// Installed
import { Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import LinearLoading from '../components/blocks/LinearLoading';

// Css
import '../assets/css/notfound.css';

function NotFound({ isAuthorized }) {

    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000)

        return () => {
            clearTimeout(timer);
        }
    }, [])

    useEffect(() => {
        document.title = "UnlockUser | Notfound";
    }, [])


    function navigateTo(value) {
        if (isAuthorized)
            navigate(value);
        else
            window.location.href = "/";
    }


    if (loading)
        return <LinearLoading size={30} cls="curtain" />;

    return (
        <div className="notfound-wrapper d-column">
            <p className='notfound-title'>
                {(id && !isAuthorized) ? "Sidan är för behöriga användare" : "Sidan finns inte"}
            </p>
            <div className='d-row w-100 jc-end notfound-buttons'>
                <Button className='notfound-btn' onClick={() => navigateTo(-1)}>
                    Go back
                </Button>
                <Button className='notfound-btn' onClick={() => navigateTo("/")}>
                    Home
                </Button>
            </div>
        </div>
    )
}

export default NotFound;