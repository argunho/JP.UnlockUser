import { useActionState, use, useEffect, useState } from 'react';

// Installed
import { TextField, FormControl } from '@mui/material';
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


function FormManual() {
    const [loading, setLoading] = useState(false);

    const { fetchData, pending: buffering, response, success, resData, handleResponse } = use(FetchContext);

    const { id } = useParams();
    const navigate = useNavigate();

    async function getDataById() {

        setLoading(true)
        try {
            await fetchData({ api: `manual/${id}` });
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
            name: fd.get("name"),
            html: fd.get("html")
        }

        await fetchData({ api: id ? `manual/${id}` : "manual", method: id ? "put" : "post", data: data });
        return null;

    }

    const [formState, formAction, pending] = useActionState(onSubmit, { error: null });

    const disabled = pending || buffering;
    const formModel = formState?.data ?? resData;

    return <>
        <TabPanel primary="Nya manual" />

        {/* Error message */}
        {response && <Message res={response} cancel={() => handleResponse()} />}

        {/* Loading */}
        {loading && <Loading msg="data hämtas..." />}

        {!loading && <form className='form-manual fade-in' action={formAction}>

            <FormControl fullWidth style={{ marginBottom: "30px" }}>
                <TextField
                    label="Titel"
                    required={true}
                    defaultValue={formModel?.name}
                    name="name"
                    placeholder="Namn på manualen, minst length 10 karaktär"
                    inputProps={{
                        minLength: 10
                    }}
                    disabled={disabled || id}

                    className="field w-100"
                />
            </FormControl>

            <Editor name="html" required={true} disabled={disabled} defaultValue={formModel?.html} />

            <FormButtons loading={pending} disabled={disabled} confirmable={true} />
        </form>}

        {/* Success modal */}
        {(success && !resData) && <ModalSuccess onClose={() => navigate(-1)} />}
    </>;
}

export default FormManual;

//key={isCleaned}  action={formAction}