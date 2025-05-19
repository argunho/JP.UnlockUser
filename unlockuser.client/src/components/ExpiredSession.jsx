// Installed 
import { useNavigate } from 'react-router-dom';

// Components
import ModalConfirm from './ModalConfirm';

function ExpiredSession() {
    const navigate = useNavigate();

    return (
        <ModalConfirm
            error={true}
            open={true}
            msg="Sessionen har löpt ut"
            content="Var vänlig och logga in igen."
            clickHandle={() => navigate("/logout")} />
    )
}

export default ExpiredSession;