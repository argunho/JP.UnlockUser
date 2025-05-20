
import { useEffect, useActionState, useState, use } from 'react';

// Installed Checkbox, FormControlLabel,
import { TextField, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';

// Components
import Response from '../../components/Response';
import Logotype from '../../components/Logotype';
import FormButtons from './../../components/FormButtons';
// Functions
import { ErrorHandle } from './../../functions/ErrorHandle';

// storage
import { AuthContext } from '../../storage/AuthContext';
import { FetchContext } from './../../storage/FetchContext';

let clear = true;

function Login() {

  const [wait, setWait] = useState();

  const { authorize } = use(AuthContext);
  const { reqFn, handleResponse, response } = use(FetchContext);

  const navigate = useNavigate();

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
      // remember: fd.get("remember") === 'on' ? true : false
    }

    try {
      const { token, groups, timeLeft } = await reqFn("authentication", "post", data) ?? {};

      if (timeLeft) {
        clear = false;
        getTimeLeftToUnblock(timeLeft);
      }
      else if (token) {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("groups", JSON.stringify(groups));
        sessionStorage.setItem("group", groups[0]?.name);

        authorize(token);
      }

      return data;
    } catch (error) {
      handleResponse(ErrorHandle(error));
      return data;
    }
  }

  function clearResponse() {
    if (wait)
      clear = true;
    else
      handleResponse();
  }

  const [formState, formAction, loading] = useActionState(onSubmit)
  const disabled = loading || !!response;


  return <div className="d-column jc-between ai-start w-100 login-wrapper p-rel fade-in">

    <Logotype />

    {/* Form */}
    <form className="d-column login-form" action={formAction}>
      <h2>Logga in</h2>

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

      <div className="d-row jc-between w-100">
        {/* <FormControlLabel className="d-row jc-start w-100" control={
          <Checkbox id="checkbox" name="remember" color={disabled ? "default" : "success"} disabled={disabled} defaultChecked={formState?.remember ?? false} />
        } label="Håll mig inloggad" /> */}

        {/* Buttons to submit the form data and confirmation to accept this submit action */}
        <FormButtons label="Logga in" disabled={disabled} loading={loading} />
      </div>

    </form>

    {/* contacts link button  */}
    <IconButton className="login-contacts-link" onClick={() => navigate("/contacts")} disabled={loading}>
      <ContactSupportIcon />
    </IconButton>

    {/* Response */}
    {(response || wait) && <Response res={response ? response : { color: "warning", msg: `Vänta ${wait} minuter innan du försöker igen.` }}
      cancel={clearResponse} />}
  </div>;
}

export default Login;
