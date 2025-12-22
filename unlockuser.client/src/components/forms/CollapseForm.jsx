
import { use, useActionState, useRef } from 'react'

// Installed
import { Collapse, TextField, Button, CircularProgress } from '@mui/material';


// Storage
import { FetchContext } from './../../storage/FetchContext';
import Message from '../blocks/Message';

const fields = {
    school: [
        { label: "Skola", name: "school" },
        { label: "Ort", name: "place" }
    ]
}

/* eslint-disable no-unused-vars */
function CollapseForm({ open = true, fieldsName, api = "", id = null }) {

    const { fetchData, response, pending: loading, handleResponse } = use(FetchContext);
    const refMessage = useRef(null);

    async function onSubmit({ previous, fd }) {
        let data = {};
        let errors = [];
        fd.forEach((value, key) => {
            if (value.length < 3)
                errors.push(key);
            else
                data[key] = value;
        });

        if (errors?.length > 0) {
            return {
                errors: errors.reduce((obj, key) => ({ ...obj, [key]: true }), {}),
                data
            };
        }

        await fetchData({ api: api, method: "post", data: data });
    }

    function onReset() {
        handleResponse(null);
    }

    const [formState, formAction, pending] = useActionState(onSubmit, { errors: null });
    const errors = formState?.errors || {};
    console.log(formState)
    return (
        <Collapse in={open} className='d-row w-100' timeout="auto" unmountOnExit>

            {/* Response, Error message */}
            {response && <Message res={response} onCancel={() => handleResponse(null)} />}
            {errors?.length > 0 && <Message res={{color: "error", message: "Fel i formuläret, kontrollera ifyllda fält"}} ref={refMessage} />}

            {/* Form */}
            <form className='d-row view-list-form w-100' action={formAction}>
                {fields[fieldsName]?.map((x, i) => {
                    return <TextField key={i}
                        fullWidth
                        name={x.name}
                        label={x.label}
                        required={x?.required !== undefined ? x.required : true}
                        defaultValue={formState?.data?.[x.name] || ""}
                        disabled={loading || pending}
                        error={formState?.errors[x.name]} />
                })}
                <Button variant="outlined" type="submit" className="form-button" disabled={loading}>
                    {loading ? <CircularProgress size={20} color="error" /> : "Spara"}
                </Button>
            </form>
        </Collapse>
    )
}

export default CollapseForm
