
import { useEffect } from 'react';

// Installed
import { AccessTime, Phone, Web } from '@mui/icons-material'
import { Alert, AlertTitle } from '@mui/material'

// Images
import support from './../../assets/images/support.png';

function Contacts() {

  useEffect(() => {
    document.title = "UnlockUser | Kontakta oss";
  }, [])

  function navigate(){
    window.open(
      "https://alvesta.topdesk.net/tas/public/ssp/",
      "_blank"
    );
  }

  return (
    // Contact information
    <div className="contacts-container">
      <div className='contacts-wrapper'>
        <img src={support} className="contact-img" alt="contact" />
        <h3>Kontakta oss</h3>
        <p className='d-flex'><Phone /> <span>0472 150 33</span></p>
        <p className='d-flex'><Web /> <span onClick={navigate}>Självbetjäningsportalen</span></p>
        
        <Alert className="contact-info" severity='info' icon={<AccessTime/>}>
          <AlertTitle>Telefontid</AlertTitle>
          <span dangerouslySetInnerHTML={{ __html: "Måndag, Onsdag och Fredag 07:30 - 12:00<br/> Tisdag och Torsdag 13:00 - 16:00"}}></span>
        </Alert>
      </div>
    </div>
  )
}

export default Contacts;
