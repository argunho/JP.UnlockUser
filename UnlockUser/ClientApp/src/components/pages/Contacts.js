import { AccessTime, Phone, Web } from '@mui/icons-material'
import { Alert, AlertTitle } from '@mui/material'
import React from 'react'
import { Link } from 'react-router-dom'
import support from './../../images/support.png'

export default function Contacts() {

  return (
    // Contact information
    <div className="contacts-container">
      <div className='contacts-wrapper'>
        <img src={support} className="contact-img" alt="contact" />
        <h3>Kontakta oss</h3>
        <p><Phone /> <Link to={{ pathname: "tel:+4647215033" }} target="_blank">0472 150 33</Link></p>
        <p><Web /> <Link to={{ pathname: "https://alvesta.topdesk.net/tas/public/ssp/" }} target="_blank">Självbetjäningsportalen</Link></p>
        <Alert className="contact-info" severity='info' icon={<AccessTime/>}>
          <AlertTitle>Telefontid</AlertTitle>
          <span dangerouslySetInnerHTML={{ __html: "Måndag, Onsdag och Fredag 07:30 - 12:00<br/> Tisdag och Torsdag 13:00 - 16:00"}}></span>
        </Alert>
      </div>
    </div>
  )
}
