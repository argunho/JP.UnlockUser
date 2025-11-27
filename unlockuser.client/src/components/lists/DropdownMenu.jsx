// Installed
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function DropdownMenu({ label, list, link, value, disabled }) {
console.log(value)
    const navigate = useNavigate();

    function onChange(e) {
        const value = e.target.value.toLowerCase();
        navigate(link ? link + value : value, { replace: true })
    }

    return (
        <FormControl fullWidth className="w-100" style={{ maxWidth: "200px" }}>
            <InputLabel key={value} id="demo-simple-select-label" shrink={value}>{label}</InputLabel>
            <Select
                displayEmpty
                value={value ?? ""}
                label={label}
                labelId="demo-simple-select-label"
                onChange={onChange}
                sx={{ color: "var(--color-active)" }}
                disabled={disabled}

            >
                {/* Loop of list */}
                {list?.map((group, index) => (
                    <MenuItem value={group?.name} key={index}>
                        <span style={{ marginLeft: "10px" }}> - {group?.name}</span>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

export default DropdownMenu;
