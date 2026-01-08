import { useState } from 'react';

// Installed
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function DropdownMenu({ label, list, link, value, disabled, keyValue = "name", keyName = "name", onChange: handleChange }) {

    const [selected, setSelected] = useState();
    const navigate = useNavigate();

    function onChange(e) {
        const value = e.target.value?.trim()?.toLowerCase();
        if (link)
            navigate(link ? link + value : value, { replace: true })
        else {
            setSelected(list.find(x => x[keyValue].toLowerCase() === value));
            handleChange(value);
        }
    }

    return (
        <FormControl fullWidth className="dm-wrapper w-100" style={{ maxWidth: "300px" }}>
            <InputLabel key={value} id="demo-simple-select-label" shrink={value}>{label}</InputLabel>
            <Select
                displayEmpty={selected || value}
                value={selected?.[keyValue] ?? value ?? ""}
                label={selected?.[keyName] ?? label}
                labelId="demo-simple-select-label"
                onChange={onChange}
                sx={{ color: "var(--color-active)", minWidth: 280 }}
                disabled={disabled}
            >
                {/* Loop of list */}
                {list?.map((item, index) => (
                    <MenuItem className="dropdown-li" value={item?.[keyValue] ?? item} key={index}>
                        <span style={{ marginLeft: "10px" }}> - {item?.[keyName] ?? item}</span>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

export default DropdownMenu;
