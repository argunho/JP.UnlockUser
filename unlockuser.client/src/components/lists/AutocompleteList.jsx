
import { useState, memo } from "react";

// Installed
import { Autocomplete, TextField } from "@mui/material";

const AutocompleteList = memo(function AutocompleteList({ label, multiple, name, collection,
    defValue, disabled, keyword, required, response, helperText, fullWidth, shrink, ref }) {

    const defaultValue = multiple ? (defValue ?? []) : ((Array.isArray(defValue) ? defValue[0] : defValue) ?? "")
    const [value, setValue] = useState(defaultValue ?? []);

    return <Autocomplete
        id="combo-box-demo"
        disablePortal
        autoHighlight
        fullWidth={fullWidth}
        disabled={!collection || disabled || response || collection?.length === 0}
        // disableCloseOnSelect={multiple} 
        filterSelectedOptions //
        freeSolo={false} //
        options={collection}
        multiple={multiple}
        value={value}
        name={name}
        onChange={(e, option) => setValue(option)}
        isOptionEqualToValue={(option, value) => {
            return option === value;
        }}
        shrink={true}
        getOptionLabel={(option) => option?.primary ?? ""}
        renderOption={(props, option, { index }) => {
            const { key, ...other } = props;
            return <li key={key} {...other}>
                <strong>{index + 1}.</strong>&nbsp;&nbsp;{option?.primary}
            </li>
        }}
        renderInput={(params) => (
            <>
                <TextField
                    {...params}
                    label={(!collection || collection?.length === 0) ? "Listan laddas eller saknas ..." : label}
                    required={collection?.length > 0 && (required && !value)}
                    helperText={helperText ?? ""}
                    InputLabelProps={{ 
                        shrink: shrink ?? false
                    }}
                    className="autocomplete-field"
                    placeholder={defValue?.length > 0 || value?.length > 0 ? "" : `Välj från listan ...`}
                    autoComplete='off'
                    autoSave='off' />

                {/* Hidden input to capture value for FormData */}
                <input
                    type="hidden"
                    name={name}
                    ref={ref}
                    value={multiple ? JSON.stringify(keyword ? value?.map(v => v[keyword]) : value)
                        : (typeof value === "object" ? (keyword ? value[keyword] : JSON.stringify(value)) : value)} />
            </>
        )}
        disableClearable={!value}
    />
})

export default AutocompleteList;