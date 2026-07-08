import { useState } from 'react';

// Installed
import { Button } from '@mui/material';

// Css
import ModalConfirm from '../modals/ModalConfirm';

function ActionButtons({ children, label, pending, disabled, onConfirm }) {

  const [confirm, setConfirm] = useState(false);

  function handleConfirm() {
    onConfirm();
    setConfirm(false);
  }

  return (
    <>
      <div className={`d-row ${(label ? "jc-between" : "jc-end")} w-100 action-wrapper`}>

        {label && <p className="label">{label}</p>}

        <div className="d-row">
          {children && children}
          <Button variant="contained" className="save" onClick={() => setConfirm(true)} disabled={pending || disabled}>
            Spara ändringar
          </Button>
        </div>
      </div>

      {/* Confirm */}
      {confirm && <ModalConfirm
        onConfirm={handleConfirm}
        onClose={() => setConfirm(false)} />}
    </>
  )
}

export default ActionButtons;     
