
import { use, useActionState, useRef } from 'react'

// Installed
import { Collapse, TextField, Button, CircularProgress } from '@mui/material';
import { useRevalidator } from 'react-router-dom';

// Components 
import Message from '../blocks/Message';

// Storage
import { FetchContext } from './../../storage/FetchContext';

const fields = {
    school: [
        { label: "Skola", name: "name" },
        { label: "Ort", name: "place" }
    ]
}

/* eslint-disable no-unused-vars */
function CollapseForm({ open = true, fieldsName, api, id }) {

    const { fetchData, pending: process, success } = use(FetchContext);
    const refMessage = useRef(null);
    const { revalidate } = useRevalidator()

    async function onSubmit(previous, fd) {

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

        const success = await fetchData({ api: api, method: "post", data: data, action: "success" });
        if(success)
            revalidate();
    }

    const [formState, formAction, pending] = useActionState(onSubmit, { errors: null });
    const errors = formState?.errors || {};

    return (
        <Collapse in={open} className='d-row w-100' timeout="auto" unmountOnExit>

            {/* Response, Error message */}
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
                        disabled={process || pending}
                        error={formState?.errors?.[x.name]} />
                })}
                <Button variant="outlined" type="submit" className="form-button" disabled={process}>
                    {(process || pending) ? <CircularProgress size={20} /> : "Spara"}
                </Button>
            </form>
        </Collapse>
    )
}

export default CollapseForm
