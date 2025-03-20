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
            content="Du loggas ut."
            closeTime={3000}
            close={closeModal} />
    )
}

export default ExpiredSession;