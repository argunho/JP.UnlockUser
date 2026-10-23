import { useState } from 'react';

// Installed
import { SearchOffSharp, SearchSharp } from '@mui/icons-material';
import { TextField, IconButton } from '@mui/material';

function SearchFilter({ 
    children, 
    label, disabled, styles, 
    placeholder = "Användarnamn, school, klass, datum, gruppnamn ...",
    onSearch, onReset, ref }) {

    const [value, setValue] = useState("");

    function changeHandle(e) {
        let value = e.target.value;
        setValue(value);
    }

    function resetHandle() {
        setValue("");
        onReset();
    }

    function clickHandle() {
        onSearch(value);
        // setValue("");
    }

    return (
        <TextField
            label={`Sök ${label ?? "här"} ...`}
            className="search-bar"
            disabled={disabled}
            value={value}
            style={styles ? styles : null}
            onChange={changeHandle}
            placeholder={placeholder}
            InputProps={{
                endAdornment:
                    <div className="d-row">

                        {value?.length == 0 && children}

                        {/* Reset form - button */}
                        {value?.length > 0 && <IconButton
                            variant="text"
                            color="error"
                            className="search-reset"
                            ref={ref}
                            onClick={resetHandle}>
                            <SearchOffSharp />
                        </IconButton>}

                        {/* Disabled button */}
                        <IconButton
                            variant="outlined"
                            color="primary"
                            className="search-button"
                            type="button"
                            onClick={clickHandle}
                            disabled={value?.length < 2}>
                            <SearchSharp />
                        </IconButton>
                    </div>
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter")
                    clickHandle();
            }}
        />
    )
}

export default SearchFilter;