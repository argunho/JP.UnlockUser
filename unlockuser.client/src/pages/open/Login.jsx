
import { useEffect, useActionState, useState, use } from 'react';

// Installed Checkbox, FormControlLabel,
import { TextField, Autocomplete } from '@mui/material'; //, IconButton // 2026-10-19
import { useNavigate, useLoaderData, useParams } from 'react-router-dom';
// import { ContactSupport } from '@mui/icons-material';

// Components
import Message from '../../components/blocks/Message';
import Logotype from '../../components/blocks/Logotype';
import FormButtons from '../../components/forms/FormButtons';

// Storage
import { AuthContext } from '../../storage/AuthContext';
import { FetchContext } from './../../storage/FetchContext';

// Css
import "./../../assets/css/login.css";


let clear = true;

function Login() {

  const [wait, setWait] = useState();
  const [moderator, setModerator] = useState(null); // 2026-10-19

  const { authorize } = use(AuthContext);
  const { response, fetchData, handleResponse } = use(FetchContext);

  const navigate = useNavigate();
  const moderators = useLoaderData() ?? [];
  const { id } = useParams();

  useEffect(() => {
    document.title = "UnlockUser | Logga in";
  }, [])

  const getTimeLeftToUnblock = (timeLeft) => {
    const num = (wait ?? timeLeft)?.split(":");
    let sec = parseInt(num[2]);
    let min = parseInt(num[1]);

    setInterval(() => {
      if (sec + min === 0 || clear) {
        clearInterval();
        setWait();
        return;
      }
      else {
        if (sec === 0) {
          if (min > 0) min -= 1;
          else min = 59;
          sec = 59;
        } else
          sec -= 1;
      }

      setWait(`00:${(min < 10) ? "0" + min : min}:${(sec < 10) ? "0" + sec : sec}`);
    }, 1000)
  }

  async function onSubmit(previous, fd) {

    const data = {
      username: fd.get("username"),
      password: fd.get("password"),
      moderatorUsername: id ? fd.get("moderator") : null
    }

    const res = await fetchData({ api: id ? `authentication/develop/mode/${id}`: "authentication", method: "post", data: data, action: "return" }) ?? {}; // 2026-10-19
    const { token, timeLeft, groupName } = res;

    if (timeLeft) {
      clear = false;
      getTimeLeftToUnblock(timeLeft);
    }
    else if (token) {
      sessionStorage.setItem("logged", new Date().toISOString());
      navigate(`/search/${groupName}`);
      authorize(token);
    }


    return data;
  }

  function clearResponse() {
    if (wait)
      clear = true;
    else
      handleResponse();
  }

  const [formState, formAction, pending] = useActionState(onSubmit)
  const disabled = pending || !!response;

  return <div className="d-column jc-between ai-start w-100 login-wrapper p-rel fade-in">

    <Logotype />

    {/* Form */}
    <form className="d-column login-form" action={formAction}>
      <h2 className="login-label">Logga in</h2>

      {[
        { name: "username", type: "text", label: "Användarnamn", },
        { name: "password", type: "password", label: "Lösenord" },
      ].map((props, index) => {
        return (
          <TextField key={index}
            className="login-input"
            defaultValue={formState && (formState[props.name] ?? "")}
            {...props} required disabled={disabled}
          />
        );
      })}

      {/* start: 2026-10-19 */}
      {moderators.length > 0 && <>
        <Autocomplete
          className="login-input"
          options={moderators}
          value={moderator}
          getOptionLabel={(option) => option?.primary ?? ""}
          isOptionEqualToValue={(option, value) => option?.secondary === value?.secondary}
          onChange={(e, option) => setModerator(option)}
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return <li key={option.secondary ?? key} {...rest}>{option.primary}</li>;
          }}
          renderInput={(params) => <TextField {...params} label="Moderator" required />}
          disabled={disabled}
        />
        {/* The visible input holds the display name, so the username (secondary) is submitted from here */}
        <input type="hidden" name="moderator" value={moderator?.secondary ?? ""} />
      </>}
      {/* end */}

      {/* Buttons to submit the form data and confirmation to accept this submit action */}
      <FormButtons
        label="Logga in"
        disabled={disabled}
        loading={pending} />
    </form>

    {/* Contacts link button  */}
    {/* <IconButton className="login-contacts-link" onClick={() => navigate("/contacts")} disabled={pending}>
      <ContactSupport />
    </IconButton> */}

    {/* Response */}
    {(response || wait) && <Message res={response ? response : { color: "warning", msg: `Vänta ${wait} minuter innan du försöker igen.` }} cancel={clearResponse} />}

  </div>;
}

export default Login;
