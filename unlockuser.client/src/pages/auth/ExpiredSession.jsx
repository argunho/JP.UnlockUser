// Installed 
import { useNavigate } from 'react-router-dom';

// Components
import ModalConfirm from './../../components/modals/ModalConfirm';

function ExpiredSession() {
    const navigate = useNavigate();

    return (
        <ModalConfirm
            open={true}
            expired={true}
            msg="Sessionen har löpt ut"
            content="Var vänlig och logga in igen."
            onConfirm={() => navigate("/session/logout")} />
    )
}

export default ExpiredSession;