
import { useEffect, useState } from 'react';

// Installed
import { Button } from '@mui/material';
import { ArrowRightAltOutlined } from '@mui/icons-material';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

// Css
import '../../assets/css/notfound.css';


function NotFound({ isAuthorized }) {

    const [message, setMessage] = useState("Sidan finns inte");

    const loc = useLocation();
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "AlvAssets | Notfound";

        let timer = setTimeout(() => {
            if (loc.pathname == "/logout")
                navigate("/");
        }, 1000)

        if (id && !isAuthorized) {
            sessionStorage.setItem("redirect", loc.pathname);
            setMessage("Sidan är för behöriga användare");
        }

        return () => {
            clearTimeout(timer);
        }
    }, [])

    function navigateTo() {
        if (!isAuthorized)
            window.location.href = "/";
        else
            navigate("/");
    }

    if (loc.pathname == "/logout")
        return null;

    return (
        <div className='notfound-container d-row wh-100 mh'>
            <div className="notfound-wrapper d-column">
                <p className='notfound-title'>{message}</p>
                <Button variant="contained" className='notfound-btn' onClick={navigateTo}
                    startIcon={<ArrowRightAltOutlined />}>
                    {isAuthorized ? "Startsidan" : "Logga in"}
                </Button>
            </div>
        </div>
    )
}

export default NotFound