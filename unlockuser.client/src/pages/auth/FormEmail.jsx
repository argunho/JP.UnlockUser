import { useActionState, use, useState, useEffect } from 'react';

// Installed
import { TextField, FormControl, InputLabel, Button} from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { useParams, useOutletContext, useRevalidator } from 'react-router-dom';

// Components
import TabPanel from '../../components/blocks/TabPanel';
import Editor from '../../components/forms/Editor';
import FormButtons from '../../components/forms/FormButtons';
import Message from '../../components/blocks/Message';
import DropdownMenu from '../../components/lists/DropdownMenu';

// Functions
import { Capitalize } from '../../functions/Helpers'
import { Claim } from './../../functions/DecodedToken';;

// Storage
import { FetchContext } from '../../storage/FetchContext';

// Services
import { ApiRequest } from '../../services/ApiRequest';
import ModalSuccess from '../../components/modals/ModalSuccess';


function FormEmail() {
    const [groups, setGroups] = useState([]);
    const [copy, setCopy] = useState(null);

    const email = Claim("email");

    const { fetchData, pending: buffering, success, response, handleResponse } = use(FetchContext);

    const { group } = useParams();
    const { loading } = useOutletContext();
    const { revalidate } = useRevalidator();

    useEffect(() => {
        async function getGroups(){
            const res = await ApiRequest("catalog/groups");
            if(res && Array.isArray(res))
                setGroups(res);
        }

        if(groups?.length === 0)
            getGroups();
    }, []);

    async function onSubmit(previous, fd) {
        if (!group)
            return;

        let data = {};
        let errors = [];

        fd.forEach((value, key) => {
            if (key !== "copyTo" && value.length < 3)
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

        const value = fd.get("copyTo");
        const copyTo = (value !== null && value?.length > 0) ? value?.split(",") : [];
        if(copy)
            copyTo.push(copy);

       data = {
            subject: data?.name,
            message: data?.html,
            copyTo: copyTo,
            group: group
        }

        // Request
        await fetchData({ api: "sendEmail", method: "post", data: data });
    }

    function onClose(){
        handleResponse();
        revalidate();
    }

    const [formState, formAction, pending] = useActionState(onSubmit, { error: null });

    const disabled = pending || buffering || !group;
    const formModel = formState?.data;
    const errors = formState?.errors;
    return <>
        <TabPanel primary={`Skicka mail`} >
            {/* Choose group */}
            <DropdownMenu
                label="Behöriga anställda"
                list={["Alla", ...groups]}
                value={group ? Capitalize(group) : ""}
                link="/send/email/"
                disabled={pending || !groups} />
        </TabPanel>

        {/* Error message */}
        {response && <Message res={response} cancel={() => handleResponse()} />}
        {!group && <Message res={{ color: "info", msg: "Välj e-postmottagare från behöriga anställda!" }} />}

        {/* Form */}
        {!loading && <form className='form-manual fade-in' action={formAction}>

            {group && <>
                <InputLabel sx={{ mb: 3 }}>Mottagare: {Capitalize(group)}</InputLabel>

                <FormControl fullWidth>
                    <TextField
                        label="Kopia"
                        defaultValue={formModel?.name}
                        name="emails"
                        placeholder="E-postadresser separerade med kommatecken ..."
                        disabled={disabled}
                        className="field w-100"
                    />
                </FormControl>
            </>}

            <FormControl fullWidth style={{ marginBottom: "30px" }}>
                <TextField
                    label="Titel"
                    required={true}
                    defaultValue={formModel?.name}
                    name="name"
                    placeholder="E-post titel ..."
                    inputProps={{
                        minLength: 5
                    }}
                    disabled={disabled}
                    className="field w-100"
                    error={errors?.name}
                />
            </FormControl>

            <Editor name="html" required={true} disabled={disabled} defaultValue={formModel?.html} />


            <FormButtons loading={pending} disabled={disabled} confirmable={true}>
                    <Button startIcon={copy ? <CheckBox/> : <CheckBoxOutlineBlank />} onClick={() => setCopy(copy ? null : email)}>
                        Skicka mig en kopia
                    </Button>
            </FormButtons>
        </form>}

        {/* Success modal */}
        {success && <ModalSuccess onClose={onClose} />}
    </>;
}

export default FormEmail;
