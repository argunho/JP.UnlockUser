import { useState } from 'react';

// Installed
import { SearchOffSharp, SearchSharp } from '@mui/icons-material';
import { TextField, IconButton } from '@mui/material';

function SearchFilter({
    children,
    label, disabled, styles, searchValue,
    placeholder = "Användarnamn, school, klass, datum, gruppnamn ...",
    onSearch, onReset, ref }) {

    const [value, setValue] = useState("");

    function changeHandle(e) {
        let value = e.target.value;

        if (!!searchValue && (value?.length <= 2 || searchValue !== value))
            resetHandle();
        setValue(value);
    }

    function resetHandle(clear) {
        setValue("");
        onReset(clear);
    }

    function clickHandle() {
        if (value?.length <= 1)
            return;

        onSearch(value);
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
                            onClick={() => resetHandle(true)}>
                            <SearchOffSharp />
                        </IconButton>}

                        {/* Disabled button */}
                        <IconButton
                            variant="outlined"
                            color="primary"
                            className="search-button"
                            type="button"
                            onClick={clickHandle}
                            disabled={value?.length < 1 || searchValue === value}>
                            <SearchSharp />
                        </IconButton>
                    </div>
            }}
            onKeyDown={(e) => {
                if (value?.length > 1 && e.key === "Enter")
                    clickHandle();
            }}
        />
    )
}

export default SearchFilter;