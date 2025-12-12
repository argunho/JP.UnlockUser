// Installed 
import { useNavigate } from 'react-router-dom';

// Components
import ModalMessage from './../../components/modals/ModalMessage';

function ExpiredSession() {
    const navigate = useNavigate();

    return (
        <ModalMessage
            msg="Sessionen har löpt ut"
            content="Var vänlig och logga in igen."
            onClose={() => navigate("/session/logout")} />
    )
}

export default ExpiredSession;