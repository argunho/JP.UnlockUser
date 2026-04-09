import { useActionState, use, useEffect, useState } from 'react';

// Installed
import { TextField, FormControl } from '@mui/material';
import { useParams } from 'react-router-dom';

// Components
import TabPanel from '../../components/blocks/TabPanel';
import Editor from '../../components/forms/Editor';
import FormButtons from '../../components/forms/FormButtons';

// Storage
import { FetchContext } from './../../storage/FetchContext';
import Loading from '../../components/blocks/Loading';


function FormManual() {
    const [loading, setLoading] = useState(false);

    const { fetchData, pending: buffering, resData } = use(FetchContext);

    const { id } = useParams();

    async function getDataById() {
            console.log(`manual/${id}`)
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

    console.log(formModel)

    return <>
        <TabPanel primary="Nya manual" />

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
    </>;
}

export default FormManual;

//key={isCleaned}  action={formAction}