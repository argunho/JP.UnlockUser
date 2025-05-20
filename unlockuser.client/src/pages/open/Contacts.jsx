
import { useEffect } from 'react';

// Installed
import { AccessTime, Phone, Web } from '@mui/icons-material'
import { Alert, AlertTitle, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom';

// Images
import support from './../../assets/images/support.png';
import Logotype from '../../components/Logotype';

function Contacts({ isAuthorized }) {

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "UnlockUser | Kontakta oss";
  }, [])

  function navigateToContactsPage() {
    window.open(
      "https://alvesta.topdesk.net/tas/public/ssp/",
      "_blank"
    );
  }

  return (
    // Contact information
    <main className="contacts-container d-row ai-start wrap mh fade-in p-rel">

      {!isAuthorized && <section className='w-100 jc-start contacts-logo' id="logotype">
        <Logotype />
      </section>}

      <section className='contacts-wrapper' id="info-contacts">
        <img src={support} className="contact-img" alt="contact" />
        <h3>Kontakta oss</h3>
        <p className='d-row'><Phone /> <span>0472 150 33</span></p>
        <p className='d-row'><Web /> <span onClick={navigateToContactsPage}>Självbetjäningsportalen</span></p>
      </section>

      <section className='contacts-wrapper' id="info-open">
        <Alert className="contact-info" severity='info' icon={<AccessTime />}>
          <AlertTitle>Telefontid</AlertTitle>
          <span dangerouslySetInnerHTML={{ __html: "Måndag, Onsdag och Fredag 07:30 - 12:00<br/> Tisdag och Torsdag 13:00 - 16:00" }}></span>
        </Alert>

      </section>

      {/* Navuigate to log in button */}
      {!isAuthorized && <div className="d-row jc-end contacts-button">
        <Button variant="outlined" color="info" onClick={() => navigate("/")}>
          Logga in
        </Button>
      </div>}
    </main>
  )
}

export default Contacts;
