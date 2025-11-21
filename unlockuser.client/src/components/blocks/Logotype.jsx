import { useNavigate } from "react-router-dom";

// Images
import logo from '../../assets/images/alvesta.svg';

function Logotype() {

    const navigate = useNavigate();

    return (
        <div className="d-row jc-between logotype" onClick={() => navigate("/")}>

            {/* Logotype */}
            <div className="logo-wrapper" id="logo-img">
                <img src={logo} className="logo" alt="https://unlock2.alvesta.se" />
            </div>

            <div className='d-column' id="logo-name">
                <p>Alvesta kommun</p>
                <p className='logotype-subtitle'>Unlock User</p>
            </div>
        </div>
    )
}

export default Logotype;