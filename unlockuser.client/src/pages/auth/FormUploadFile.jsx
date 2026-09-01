import { useState, use, useEffect, useRef, useActionState } from 'react';

// installed
import { TextField, InputLabel, IconButton } from '@mui/material';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';


// Components
import Message from '../../components/blocks/Message';
import ModalSuccess from '../../components/modals/ModalSuccess';
import FormButtons from '../../components/forms/FormButtons';
import TabPanel from '../../components/blocks/TabPanel';

// Storage
import { FetchContext } from '../../storage/FetchContext';

const fields = [
    {
        label: "Kund id",
        name: "customerId",
        placeholder: "T.ex. C84worlfg (hittas i Google Admin-konsolen under Konto > Kontoinställningar)"
    },
    {
        label: "Kund e-postadress",
        name: "customerEmail",
        placeholder: "T.ex. admin@dinorganisation.se – kontot som service-filen ska ge åtkomst till"
    },
    {
        label: "Applikation namn",
        name: "appName",
        placeholder: "T.ex. UnlockUser – namnet som identifierar applikationen mot Google API" // 2026-08-31 10:34
    }
]

function FormUploadFile() {

    const [file, setFile] = useState();

    const refUpload = useRef();
    const navigate = useNavigate();
    const { response, pending: loading, success, fetchData, handleResponse, cancelRequest } = use(FetchContext);

    useEffect(() => {
        document.title = "UnlockUser | Ladda up file";
    }, [])

    function onFileChange(ev) {
        ev.preventDefault();

        if (!ev.target.files || ev.target.files?.length === 0)
            return;

        const file = ev.target.files[0];
        const extension = file.name.split(".").pop().toLowerCase();

        if ("json" !== extension) {
            handleResponse({ color: "error", msg: `Filtypen måste vara 'json' uppladdat filtypen är ${file?.type}.` });
            return;
        }
        setFile(file);
    }

    async function onSubmit(previous, fd) {

        const data = {
            customerId: fd.get("customerId"),
            customerEmail: fd.get("customerEmail"),
            appName: fd.get("appName")
        }
        let errors = [];

        if (data?.customerId?.length == 0)
            errors.push("customerEmail");
        if (data?.customerId?.length == 0)
            errors.push("customerEmail");
        if (data?.appName?.length == 0)
            errors.push("appName");

        if (errors?.length > 0) {
            return {
                errors: errors.reduce((obj, key) => ({ ...obj, [key]: true }), {}),
                data
            };
        }

        let formData = new FormData();
        formData.append("file", file);
        formData.append("data", JSON.stringify(data));

        await fetchData({ api: "data/upload/service/file", method: "post", data: formData, action: "done" });
        setFile();
        return null;
    }

    const [formState, formAction, pending] = useActionState(onSubmit, null);
    const errors = formState?.errors;

    return (
        <>
            <TabPanel primary="Google-tjänstkonto" secondary={file?.name ?? "---------"} />

            {/* Message */}
            {response && <Message res={response} cancel={() => handleResponse()} />}

            <form className='form-manual fade-in w-100' action={formAction} id="form-upload">

                {fields?.map((field, ind) => (
                    <div className="field-wrapper w-100" id="file-name" key={ind}>
                        <InputLabel className="w-100 p-rel">
                            {field?.label}
                        </InputLabel>
                        <TextField
                            className="w-100 field"
                            name={field?.name}
                            required
                            disabled={loading || response}
                            placeholder={field?.placeholder}
                            defaultValue={formState?.[field?.name] ?? ""}
                            error={errors?.[field?.name]}
                        />
                    </div>
                ))}

                {/* Upload file, readonly */}
                <div className="field-wrapper w-100" id="upload-file">
                    <InputLabel className="w-100 p-rel" required>
                        Service fil här
                    </InputLabel>
                    <TextField
                        className="w-100 field"
                        type="readonly"
                        value={file?.name ?? ""}
                        InputProps={{
                            endAdornment: <IconButton onClick={() => refUpload.current.click()}>
                                <UploadFileIcon />
                            </IconButton>
                        }}
                        disabled={loading || response}
                        placeholder="Klicka på ikonen till höger och välj service-kontots .json-fil" // 2026-08-28 11:55
                        required
                    />
                </div>

                <FormButtons
                    confirmable={true}
                    loading={pending}
                    disabled={pending || response || !file}
                    {...(pending ? { onCancel: cancelRequest } : null)} />

                {/* Upload file input */}
                <input type="file" name="file" onChange={onFileChange} className="none" ref={refUpload} />
            </form >


            {/* Success response */}
            {success && <ModalSuccess onClose={() => navigate("/")} />}
        </>
    )
}

export default FormUploadFile;
