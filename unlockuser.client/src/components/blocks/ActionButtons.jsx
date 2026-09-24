import { useState } from 'react';

// Installed
import { Button } from '@mui/material';

// Css
import ModalConfirm from '../modals/ModalConfirm';

function ActionButtons({ children, label, pending, disabled, action, onClick }) {

  const [confirm, setConfirm] = useState(false);

  function handleClick(){
    if(action.confirm)
      setConfirm(true);
    else
      onClick();
  }

  function handleConfirm() {
    onClick();
    setConfirm(false);
  }

  return (
    <>
      <div className={`d-row ${(label ? "jc-between" : "jc-end")} w-100 action-wrapper`}>

        {label && <p className="label">{label}</p>}

        <div className="d-row">

          {children && children}

          {/* Button to save/update changed data */}
          <Button
            variant="contained"
            className="save"
            color={action?.color ?? "primary"}
            onClick={handleClick}
            disabled={pending || disabled}>
            {action?.name ?? "Spara ändringar"}
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
