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
import DropdownMenu from '../../components/lists/DropdownMenu';

// Storage
import { FetchContext } from '../../storage/FetchContext';


function FormEmail() {
    const [prevFormModel, setPrevFormModel] = useState(undefined);

    const { fetchData, pending: buffering, response, success, handleResponse } = use(FetchContext);

    const { group } = useParams();
    const item = useLoaderData();
    const navigate = useNavigate();
    const { loading } = useOutletContext();

    async function onSubmit(previous, fd) {
        if(!group)
            return;

        const data = {
            subject: fd.get("name") ?? item?.name,
            message: fd.get("html"),
            group: group
        }

        // Request
        await fetchData({ api: "sendEmail", method: "post", data: data });
        return null;
    }

    const [formState, formAction, pending] = useActionState(onSubmit, { error: null });

    const disabled = pending || buffering || !group;
    const formModel = formState?.data ?? item;

    if (formModel !== prevFormModel) {
        setPrevFormModel(formModel);
    }


    return <>
        <TabPanel primary={`Skicka mail`} >
            {/* Choose group */}
            <DropdownMenu
                label="Mottagare"
                list={["Alla", "Studenter", "Personal", "Politiker"]}
                value={group ? group : ""}
                link="/send/mail/"
                disabled={pending} />
        </TabPanel>

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
                    disabled={disabled}
                    className="field w-100"
                />
            </FormControl>

            <Editor name="html" required={true} disabled={disabled} defaultValue={formModel?.html} />

            <FormButtons loading={pending} disabled={disabled} confirmable={true} />
        </form>}

        {/* Success modal */}
        {(success && !item) && <ModalSuccess onClose={() => navigate(-1)} />}
    </>;
}

export default FormEmail;