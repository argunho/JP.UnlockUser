import { useState} from 'react';

// Installed
import { Button } from '@mui/material';

// Css
import ModalConfirm from '../modals/ModalConfirm';

function ActionButtons({ pending, onConfirm }) {

  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <div className="d-row jc-end w-100 action-wrapper">
        <Button onClick={() => setConfirm(true)} disabled={pending}>
            Spara ändringar
        </Button>
      </div>

      {/* Confirm */}
      {confirm && <ModalConfirm
        msg={`This action will permanently delete the item?`}
        onConfirm={onConfirm}
        onClose={() => setConfirm(false)} />}
    </>
  )
}

export default ActionButtons;     
