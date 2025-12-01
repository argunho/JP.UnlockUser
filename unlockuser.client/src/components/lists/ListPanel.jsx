import { use, useState } from 'react';

// Installed
import { Button, Tooltip, IconButton } from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank, Delete, Cancel } from '@mui/icons-material';

// Components
import ModalConfirm from '../modals/ModalConfirm';

// Storage
import { FetchContext } from '../../storage/FetchContext';

function ListPanel({ children, selected, ids = [], api, disabled, handleSelected }) {

    const [confirm, setConfirm] = useState(false);
    const { fetchData, cancelRequest } = use(FetchContext);

    async function removeSelected() {
        setConfirm(false);
        if (selected?.length > 0) {
            await fetchData({ api: `${api}/multiple/${selected.toString().replaceAll("/", "&")}`, method: "delete" });
            sessionStorage.clear();
        }
    }

    const checked = ids.filter(i => selected.indexOf(i) > -1);

    const lgh = ids?.length;
    const slgh = selected?.length;
    const clgh = checked?.length;
    const msg = `Radera alla ${slgh} markerade`;

    return <>
        <div className={`ul-panel d-row jc-between w-100${(lgh === checked.length && ids?.length > 0) ? " checked" : ""}`}>

            <Button type="button" onClick={() => handleSelected(ids)} color="success" startIcon={
                (lgh === checked.length && ids?.length > 0) ? <CheckBox color={disabled ? "default" : "success"} /> : <CheckBoxOutlineBlank />
            } endIcon={lgh} disabled={lgh == 0 || disabled || ids?.length == 0}>
                Markera alla
            </Button>

            {children}

            <div className="d-row">
                {/* Reset request button */}
                {disabled && <IconButton onClick={cancelRequest}>
                    <Cancel color="error" />
                </IconButton>}

                {/* Button to remove selected */}
                <Tooltip title={msg}
                    classes={{
                        tooltip: "tooltip-error",
                        arrow: "tooltip-arrow-red"
                    }}
                    disableHoverListener={clgh == 0}
                    arrow>
                    <span>
                        <IconButton disabled={clgh === 0 || disabled} onClick={() => setConfirm(true)}>
                            <Delete color={(slgh > 0 && !disabled) ? "error" : "default"} />
                        </IconButton>
                    </span>
                </Tooltip>
            </div>

        </div>


        {/* Success response */}
        {confirm && <ModalConfirm
            open={true}
            content={slgh > clgh ? `<span style='color: #cc0000'>${msg}, från olika sidor?</span>` : null}
            clickHandle={removeSelected}
            close={() => setConfirm(false)} />}
    </>
}

export default ListPanel;