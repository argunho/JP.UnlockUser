import { useEffect, useState } from 'react';

// Installed
import { SearchOffSharp, SearchSharp } from '@mui/icons-material';
import { Button, TextField } from '@mui/material';

function SearchFilter({ label, disabled, clean, onChange, onReset }) {
    SearchFilter.displayName = "SearchFilter";

    const [keyword, setKeyword] = useState("");

    useEffect(() => {
        if (clean && keyword?.length > 0)
            setKeyword("");
    }, [clean])

    const changeHandler = (e) => {
        if (!e?.target) return;
        let value = e.target.value;
        onChange(value);
        setKeyword(value);
    }

    const resetFilter = () => {
        setKeyword("");
        onReset();
    }

    return <div className='search-form-logs'>
        <TextField
            label={`Sök ${label} ...`}
            className='search-full-width'
            value={keyword}
            disabled={!!disabled}
            placeholder="Anvädarnamn, school, klass, datum, gruppnamn ..."
            onChange={changeHandler}
            InputProps={{
                endAdornment: <div className="d-row">

                    {/* Reset form - button */}
                    {keyword?.length > 0 && <Button
                        variant="text"
                        color="error"
                        className="search-reset search-button-mobile"
                        onClick={resetFilter}>
                        <SearchOffSharp />
                    </Button>}

                    {/* Disabled button */}
                    <Button
                        variant="outlined"
                        color="inherit"
                        className="search-button search-button-mobile"
                        type="button"
                        disabled={true}>
                        <SearchSharp /></Button>
                </div>
            }}
        />
    </div>
}

export default SearchFilter;