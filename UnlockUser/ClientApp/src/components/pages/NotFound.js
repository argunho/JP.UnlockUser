import React, { useEffect, useState } from 'react';
import { WrongLocation } from '@mui/icons-material';

// Images
import error from './../../images/error.jpg'

// Css
import './../../css/notfound.css'

export default function NotFound(props) {

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
            document.title = "UnlockUser | Ingen result";
        }, 1500)
    }, [])

    if (loading)
        return null;

    return (
        <div className='notfound-container'>
            <img className='notfound-img' src={error} alt={props.location.pathname} />
            <div className='notfound-wrapper'>
                <p className='notfound-title'>Sidan kunde inte hittas</p>
                <p className='notfound-url'><WrongLocation /> <span>{window.location.href}</span></p>
            </div>
        </div>
    )
}
