import { useState } from 'react';

// Installed
import { Button } from '@mui/material';
import { Feed, MenuBook } from '@mui/icons-material';

// Css
import './../../assets/css/side_menu.css';

function SideMenu({ label, list, disabled, clickHandle }) {

    const [index, setIndex] = useState(0);

    function onClick(index) {
        setIndex(index);
        clickHandle(list[index]);
    }

    if (list?.length === 0)
        return null;

    return (
        <div className="d-column jc-start sm-wrapper">

            <h2 className="sm-label w-100 d-row jc-start">
                <MenuBook />
                {label}
            </h2>

            {list.map((item, ind) => {
                return <Button
                    key={ind}
                    color="primary"
                    variant="text"
                    className={`sm-btn w-100${index === ind ? " active" : ""}`}
                    onClick={() => onClick(ind)}
                    disabled={disabled}
                    startIcon={<Feed />}
                >
                    <span className="sm-btn-label d-row jc-start">{item?.primary ?? item}</span>
                </Button>
            })}
        </div >
    )
}

export default SideMenu
