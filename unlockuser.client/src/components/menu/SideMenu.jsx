import { useState } from 'react';

// Installed
import { Button } from '@mui/material';
import { Circle } from '@mui/icons-material';

// Css
import './../../assets/css/side_menu.css';

function SideMenu({ list, disabled, clickHandle }) {

    console.log(list)

    const [index, setIndex] = useState(0);

    function onClick(index) {
        setIndex(index);
        clickHandle(list[index]);
    }

    if (list?.length === 0)
        return null;

    return (
        <div className="d-column jc-start sm-wrapper">
            {list.map((item, ind) => {
                return <Button
                    key={ind}
                    color="primary"
                    variant="text"
                    className={`sm-btn w-100${index === ind ? " active" : ""}`}
                    onClick={() => onClick(ind)}
                    disabled={disabled}
                    startIcon={<Circle />}
                >
                    {item?.primary ?? item}
                </Button>
            })}
        </div >
    )
}

export default SideMenu
