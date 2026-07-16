import { useActionState, use, useState } from 'react';

// Installed
import { TextField, FormControl, FormControlLabel, Checkbox } from '@mui/material';
import { useParams, useNavigate, useLoaderData, useOutletContext } from 'react-router-dom';

// Components
import TabPanel from '../../components/blocks/TabPanel';
import Editor from '../../components/forms/Editor';
import FormButtons from '../../components/forms/FormButtons';
import ModalSuccess from '../../components/modals/ModalSuccess';
import Message from '../../components/blocks/Message';

// Storage
import { FetchContext } from './../../storage/FetchContext';

const checkboxes = {
    popup: {
        name: "popup",
        label: "Popup-meddelande"
    }
}

function FormManual({ api, label, checkbox }) {
    const [checkboxValue, setCheckboxValue] = useState(false);
    const [prevFormModel, setPrevFormModel] = useState(undefined);

    const { fetchData, pending: buffering, response, success, handleResponse } = use(FetchContext);

    const { id } = useParams();
    const item = useLoaderData();
    const navigate = useNavigate();
    const { loading } = useOutletContext();

    async function onSubmit(previous, fd) {
        const data = {
            name: fd.get("name") ?? item?.name,
            html: fd.get("html")
        }

        if (!!checkbox) {
            data[checkbox] = fd.get(checkbox) === "on";
        }

        // Request
        await fetchData({ api: id ? `${api}/${id}` : "manual", method: id ? "put" : "post", data: data });
        return null;
    }

    const [formState, formAction, pending] = useActionState(onSubmit, { error: null });

    const disabled = pending || buffering;
    const formModel = formState?.data ?? item;

    if (!!checkbox && formModel !== prevFormModel) {
        setPrevFormModel(formModel);
        setCheckboxValue(!!formModel?.[checkbox]);
    }
    

    return <>
        <TabPanel primary={label ?? (id && (!formModel ? "Data hämtras..." : `Edit: ${formModel?.name}`))} />

        {/* Error message */}
        {response && <Message res={response} cancel={() => handleResponse()} />}

        {/* Form */}
        {!loading && <form className='form-manual fade-in' action={formAction}>

            <FormControl fullWidth style={{ marginBottom: "30px" }}>
                <TextField
                    label="Titel"
                    required={true}
                    defaultValue={formModel?.name}
                    name="name"
                    placeholder="Namn på manualen, minst length 5 karaktär"
                    inputProps={{
                        minLength: 5
                    }}
                    disabled={disabled || id}
                    className="field w-100"
                />
            </FormControl>

            <Editor name="html" required={true} disabled={disabled || (id && !item)} defaultValue={formModel?.html} />

            {/* Change the password input type */}
            {!!checkbox && <FormControlLabel
                className="checkbox margin"
                control={<Checkbox
                    color="success"
                    name={checkboxes[checkbox]?.name}
                    checked={checkboxValue}
                    onChange={(e) => setCheckboxValue(e.target.checked)}
                    disabled={disabled} />}
                label={checkboxes[checkbox]?.label} />}

            <FormButtons loading={pending} disabled={disabled} confirmable={true} />
        </form>}

        {/* Success modal */}
        {(success && !item) && <ModalSuccess onClose={() => navigate(-1)} />}
    </>;
}

export default FormManual;