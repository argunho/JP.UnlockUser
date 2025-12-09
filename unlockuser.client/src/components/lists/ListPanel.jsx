// Installed
import { Button } from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank, TuneSharp } from '@mui/icons-material';


function ListPanel({ selected, ids, disabled, onSelected, onClick }) {

    const checked = (ids?.length == selected?.length);

    return <div className={`ul-panel d-row jc-between w-100${checked ? " checked" : ""}`}>

        <Button type="button" onClick={() => onSelected(ids)} color="success" startIcon={
            checked ? <CheckBox color={disabled ? "default" : "success"} /> : <CheckBoxOutlineBlank />
        } endIcon={ids?.length} disabled={disabled}>
            Markera alla
        </Button>


        <Button disabled={selected?.length === 0 || disabled} onClick={onClick} starIcon={<TuneSharp />}>
            Hantera {selected?.length} markerade kontot
        </Button>
    </div>
}

export default ListPanel;