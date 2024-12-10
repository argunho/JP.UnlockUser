// Components
import ModalView from './ModalView';

function ExpiredSession({ navigate }) {
    ExpiredSession.displayName = "ExpiredSession";

    const closeModal = () => {
        navigate("/logout");
    }

    return (
        <ModalView
            error={true}
            open={true}
            msg="Sessionen har löpt ut"
            content="Var vänlig och logga in igen."
            close={closeModal} />
    )
}

export default ExpiredSession;