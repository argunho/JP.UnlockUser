import React from 'react'
import { WrongLocation } from '@mui/icons-material'
import error from './../../images/error.jpg'
import './../../css/notfound.css'

export default function NotFound(props) {

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
