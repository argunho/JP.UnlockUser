// Installed
import { Button } from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank, TuneSharp, ArrowForward } from '@mui/icons-material';

function ListPanel({ selected, ids, disabled, onSelected, onClick }) {

    const checked = (ids?.length == selected?.length);

    return <div className={`ul-panel d-row jc-between w-100${checked ? " checked" : ""}`}>

        {/* Select all items */}
        <Button type="button" onClick={() => onSelected(ids)} color="default" startIcon={
            checked ? <CheckBox color={disabled ? "default" : "success"} /> : <CheckBoxOutlineBlank />
        } endIcon={ids?.length} disabled={disabled}>
            Markera alla
        </Button>

        {/* Navigation  button */}
        <Button
            color="default"
            disabled={selected?.length === 0 || disabled}
            endIcon={selected?.length === 0 ? <TuneSharp /> : <ArrowForward color="success" />}
            onClick={onClick}>
            Hantera {selected?.length} markerade kontot
        </Button>
    </div>
}

export default ListPanel;