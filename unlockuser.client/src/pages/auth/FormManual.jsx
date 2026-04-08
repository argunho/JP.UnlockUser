import { useActionState, use } from 'react';

// Installed
import { TextField, FormControl } from '@mui/material';

// Components
import TabPanel from '../../components/blocks/TabPanel';
import Editor from '../../components/forms/Editor';
import FormButtons from '../../components/forms/FormButtons';

// Storage
import { FetchContext } from './../../storage/FetchContext';


function FormManual() {
    const { fetchData, pending: loading } = use(FetchContext);

    async function onSubmit(previous, fd) {
        const data = {
            name: fd.get("name"),
            html: fd.get("html")
        }

        await fetchData({ api: "manual", method: "post", data: data });
        return null;

    }

    const [formState, formAction, pending] = useActionState(onSubmit, { error: null });

    const disabled = pending || loading;

    return <>
        <TabPanel primary="Nya manual" />

        <form className='form-manual fade-in' action={formAction}>

            <FormControl fullWidth style={{ marginBottom: "30px" }}>
                <TextField
                    label="Titel"
                    required={true}
                    defaultValue={formState?.data?.name}
                    name="name"
                    placeholder="Namn på manualen, minst length 10 karaktär"
                    inputProps={{
                        minLength: 10
                    }}
                    disabled={disabled}
                    className="field w-100"
                />
            </FormControl>

            <Editor name="html" required={true} disabled={disabled} />

            <FormButtons disabled={disabled}/>
        </form>
    </>;
}

export default FormManual;

//key={isCleaned}  action={formAction}