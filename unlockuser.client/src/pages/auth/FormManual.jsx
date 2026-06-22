import { useActionState, use, useEffect, useState } from 'react';

// Installed
import { TextField, FormControl, FormControlLabel, Checkbox } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import TabPanel from '../../components/blocks/TabPanel';
import Editor from '../../components/forms/Editor';
import FormButtons from '../../components/forms/FormButtons';
import Loading from '../../components/blocks/Loading';
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
    const [loading, setLoading] = useState(false);

    const { fetchData, pending: buffering, response, success, resData, handleResponse } = use(FetchContext);

    const { id } = useParams();
    const navigate = useNavigate();

    async function getDataById() {

        setLoading(true)
        try {
            await fetchData({ api: `${api}/${id}` });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!id) return;

        getDataById();
    }, [id])


    async function onSubmit(previous, fd) {
        const data = {
            name: fd.get("name") ?? resData?.name,
            html: fd.get("html")
        }

        if(!!checkbox){
            data[checkbox] = fd.get(checkbox) === "on";
        }

        // Request
        await fetchData({ api: id ? `${api}/${id}` : "manual", method: id ? "put" : "post", data: data });
        return null;

    }

    const [formState, formAction, pending] = useActionState(onSubmit, { error: null });

    const disabled = pending || buffering;
    const formModel = formState?.data ?? resData;

    return <>
        <TabPanel primary={label ?? (id && (!formModel ? "Data hämtras..." : `Edit: ${formModel?.name}`))} />

        {/* Error message */}
        {response && <Message res={response} cancel={() => handleResponse()} />}

        {/* Loading */}
        {loading && <Loading msg="Data hämtas..." style={{ flex: 1 }} />}

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

            <Editor name="html" required={true} disabled={disabled || (id && !resData)} defaultValue={formModel?.html} />

            {/* Change the password input type */}
            {!!checkbox && <FormControlLabel
                className="checkbox margin"
                control={<Checkbox
                    color="success"
                    name={checkboxes[checkbox]?.name}
                    checked={formModel[checkbox]}
                    disabled={disabled} />}
                label={checkboxes[checkbox]?.label} />}

            <FormButtons loading={pending} disabled={disabled} confirmable={true} />
        </form>}

        {/* Success modal */}
        {(success && !resData) && <ModalSuccess onClose={() => navigate(-1)} />}
    </>;
}

export default FormManual;

//key={isCleaned}  action={formAction}