import { useState } from 'react';

// Installed
import { SearchOffSharp, SearchSharp } from '@mui/icons-material';
import { TextField, IconButton } from '@mui/material';

function SearchFilter({ label, disabled, onSearch, onReset }) {

    const [value, setValue] = useState("");

    function changeHandle(e) {
        let value = e.target.value;
        console.log(value)
        setValue(value);
    }

    function resetHandle() {
        setValue("");
        onReset();
    }

    function clickHandle(){
        onSearch(value);
        resetHandle();
    }

    return (
        <TextField
            label={`Sök ${label} ...`}
            className="search-bar"
            disabled={disabled}
            value={value}
            onChange={changeHandle}
            placeholder="Anvädarnamn, school, klass, datum, gruppnamn ..."
            InputProps={{
                endAdornment:
                    <div className="d-row">

                        {/* Reset form - button */}
                        {value?.length > 0 && <IconButton
                            variant="text"
                            color="error"
                            className="search-reset search-button-mobile"
                            onClick={resetHandle}>
                            <SearchOffSharp />
                        </IconButton>}

                        {/* Disabled button */}
                        <IconButton
                            variant="outlined"
                            color="primary"
                            className="search-button search-button-mobile"
                            type="button"
                            onClick={clickHandle}
                            disabled={value?.length < 2}>
                            <SearchSharp />
                        </IconButton>
                    </div>
            }}
        />
    )
}

export default SearchFilter;