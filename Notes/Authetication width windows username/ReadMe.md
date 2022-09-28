# Authentication with windows credentials

## C# code row => 11-91

### This code was used to authenticate with windows username but after publishing to a server using IIS 
### it is impossible longer to use this code to determine windows username because is always null.
### If this code is needed again, then all this C# code below from line 11-91 must be copied and put in AuthController in #region GET before #region POST
### and follow instructions ned after c# code from row 94

#### c#
``` c#
// Validate user access first with Windows authentication username when user started application
[HttpGet]
public JsonResult AccessValidation()
{
    string? errorMessage = null;
    try
    {
        var name = Environment.UserName; // Get windows username;
        if (name == null) // If failed to get username, try other way to get windows username
        {
            var currentUser = WindowsIdentity.GetCurrent();
            if (currentUser != null)
                name = currentUser?.Name.ToString().Split('\\')[1];
        }

        if (name?.Length > 0)
        {
            var user = _provider.FindUserByExtensionProperty(name); // Get user from Active Directory
            if (user != null && _provider.MembershipCheck(name, "Password Reset Students-EDU")) // Check user's membership
            {
                // If user is found, create Jwt Token to get all other information and to get access to other functions
                var token = CreateJwtToken(user);
                return new JsonResult(new
                {
                    access = true,
                    alert = "success",
                    token = token,
                    msg = "Din åtkomstbehörighet har bekräftats."
                });
            }
        }
    }
    catch (Exception ex)
    {
        errorMessage = ex.Message;
    }

    return new JsonResult(new
    {
        access = false,
        alert = "warning",
        msg = "Åtkomst nekad! Du har inte behörighet att redigera elevs lösenord",
        errorMessage = errorMessage ?? "Inga windows-uppgifter kunde identifieras."
    });
}

// Save admin password
[HttpGet("credential/{password}")]
[Authorize]
public JsonResult SetFullCredential(string password)
{
    var errorMessage = "Felaktig lösenord.";

    // If the user is not locked, validate user's password
    UserCredentials.BlockTime = null;
    try
    {
        if (_provider.AccessValidation(UserCredentials.Username, password))
        {
            UserCredentials.Password = password;
            UserCredentials.Attempt = 0;
            return new JsonResult(new { success = true });
        }
    }
    catch (Exception ex)
    {
        errorMessage = "Fel: " + ex?.InnerException?.Message ?? ex.Message;
    }

    // If the user tried to put in a wrong password, save this like +1 a wrong attempt and the max is 4 attempts
    UserCredentials.Attempt += 1;
    if (UserCredentials.Attempt == 3)
    {
        UserCredentials.Attempt = 0;
        UserCredentials.BlockTime = DateTime.Now;
    }

    return new JsonResult(new { success = false, msg = errorMessage });
}
```
### end c#


### - Reactjs

#### App.js, replace current App.js with this code row 100-152
``` js
import React, { Component } from 'react';
import { Route } from 'react-router';
import { Layout } from './components/Layout';
import { Switch, withRouter } from 'react-router-dom';
import { Home } from './components/pages/Home';
import { Login } from './components/pages/Login';
import { UserManager } from './components/pages/UserManager';
import UsersManager from './components/pages/UsersManager';
import { Search } from './components/pages/Search';

import './css/custom.css'
import NotFound from './components/pages/NotFound';

class App extends Component {
  static displayName = App.name;

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
    var token = sessionStorage.getItem("token");
    this.setState({ isAuthorized: (token !== null && token !== undefined) })
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      var token = sessionStorage.getItem("token");

      setTimeout(() => {
        this.setState({ isAuthorized: (token !== null && token !== undefined) })
      }, 100)
    }
  }

  render() {
    const { isAuthorized } = this.state;
    return (
      <Layout isAuthorized={this.state.isAuthorized}>
        <Switch>
          <Route exact path='/' render={(props) => <Home {...props} isAuthorized={isAuthorized} />} />
          <Route exact path='/login' component={Login} />
          <Route exact path='/find-user' component={Search} />
          <Route exact path='/manage-user/:id' component={UserManager} />
          <Route exact path='/manage-users/:cls/:school' component={UsersManager} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    );
  }
}
export default withRouter((props) => <App {...props} />);
```
#### App.js

#### Home.js, you can find outside this folder. Copy this and place into .\ActivDerictory\ClientApp\src\components\pages
#### Update Form.js with code below

[comment]: <> Place among parameters
```js 
const [adminPassword, setAdminPassword] = useState("");
const [credentials, setCredentials] = useState(sessionStorage.getItem("credentials") === "ok");
```

[comment]: <> Place this after Helptexts array
```js
/* Help texts fro admin password */
const helpTextCredentialAccess = [
    { label: "Admin Lösenord", tip: "<pre>* Admins lösenord krävs om användaren är auktoriserad med Windows-data för att bekräfta auktorisering för att låsa upp användarkonto eller återställa/redigera elevs lösenord</pre>" }
]
```

[comment]: <> Put these functions below somewhere after the useEffect function
```js
// Confirm credential
const confirmCredential = async (e) => {
    e.preventDefault();
    setLoad(true);

    await axios.get("auth/credential/" + adminPassword, _config).then(res => {
        setLoad(false);
        if (res.data.success) {
            sessionStorage.setItem("credentials", "ok");
            setCredentials(true);
        } else {
            setResponse({
                alert: "warning",
                msg: res.data.msg
            })
            setCredentialError(true);
        }

    }, error => {
        // Handle of error
        setLoad(false);
        setCredentialError(true);
        if (error.response.status === 401) noAccess();
        else setError(true);
    })
}
// Handle keydown
const handleKeydown = (e) => {
    if (e?.key === 'Enter') confirmCredential(e);
}
```

[comment]: <> This current bit of code which is returned to the user interface into return block return () at the bottom of the page Form.js, replace with this code below
```js
<div className='collapse-wrapper'>
    {/* The curtain over the block disables all action if the form data is submitted and waiting for a response */}
    {load ? <div className='curtain-block'></div> : null}

    {/* Confirm credentials to set password */}
    {!credentials ?
        <div className='confirm-wrapper' style={{ background: "#FFF" }}>
            <div className='confirm-block'>

                {/* Modal  window with help texts */}
                <ModalHelpTexts arr={helpTextCredentialAccess} isTitle="Varför behövs admins lösenord?" />

                {/* Response message */}
                {alert(credentialError)}

                <form onSubmit={confirmCredential}>
                    <TextField
                        label="Admin lösenord"
                        type="password"
                        required
                        className='input-block'
                        name="adminPassword"
                        value={adminPassword}
                        inputProps={{
                            minLength: 8,
                            autoComplete: adminPassword,
                            form: { autoComplete: 'off', }
                        }}
                        placeholder="Din admin lösenord här ..."
                        disabled={load}
                        onKeyDown={(e) => handleKeydown(e)}
                        onChange={(e) => setAdminPassword(e.target.value)}
                    />
                    <Button
                        variant='contained'
                        disabled={load || adminPassword.length < 8}
                        type="submit">
                        Jag bekräftar mina behörigheter
                    </Button>
                </form>
            </div>
        </div> :
        <>
            {/* Confirm actions block */}
            {confirmSubmit ? <div className='confirm-wrapper'>
                <div className='confirm-block'>
                    Är du säker att du vill göra det?
                    <div className='buttons-wrapper'>
                        <Button type="submit" variant='contained' color="error" onClick={() => confirmHandle()}>Ja</Button>
                        <Button variant='contained' color="primary" onClick={() => resetForm(false)}>Nej</Button>
                    </div>
                </div>
            </div> : null}

            {/* Modal  window with help texts */}
            <ModalHelpTexts arr={helpTexts} isTitle="Lösenordskrav" />

            {/* Title */}
            <p className='form-title'>{title}</p>

            {/* Response message */}
            {alert(!credentialError && response)}

            {/* Form actions */}
            <div className='form-actions'>

                {multiple ? <>
                    {/* Loop of radio input choices to choose is password same or not for all students */}
                    {[{ label: "Samma lösenord", value: false }, { label: "Olika lösenord", value: true }].map((p, index) => (
                        <FormControlLabel
                            key={index}
                            control={<Radio size='small' />}
                            checked={p.value === variousPassword}
                            label={p.label}
                            name="samePassword"
                            onChange={() => setVariousPassword(p.value)} />
                    ))}

                    {/* Different alternatives for password generation */}
                    <div className={`dropdown-div${(variousPassword ? " dropdown-open" : "")}`}>
                        <div className='dropdown-interior-div'>
                            {/* Loop of radio input choices to choose password type strong or not */}
                            <FormLabel className="label">Lösenordstyp</FormLabel>
                            {[{ label: "Komplicerad", value: true }, { label: "Enkel", value: false }].map((p, index) => (
                                <FormControlLabel
                                    key={index}
                                    control={<Radio
                                        size='small'
                                        checked={p.value === strongPassword}
                                        color={strongPassword ? "error" : "success"} />}
                                    label={p.label}
                                    name="strongPassword"
                                    onChange={() => setPassType(p.value)} />
                            ))}

                            <FormControl className={'select-list' + (!strongPassword ? "" : " disabled")}>
                                <InputLabel className='select-label'>Lösenords kategory</InputLabel>
                                <Select
                                    labelId="demo-simple-select-standard-label"
                                    value={selectedCategory}
                                    onChange={handleSelectListChange}
                                    label="Lösenords kategory"
                                    disabled={strongPassword}
                                >
                                    <MenuItem value=""><span style={{ marginLeft: "10px", color: "#1976D2" }}>Välj en från listan ...</span></MenuItem>
                                    <MenuItem></MenuItem>
                                    {passwordKeys.map((l, index) => (
                                        <MenuItem value={l.label} key={index}>
                                            <span style={{ marginLeft: "10px" }}> - {l.label}</span>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {ready ?
                                <div className="last-options">
                                    <FormLabel className="label-small">Lösenords alternativ (antal siffror i lösenord)</FormLabel>
                                    {[{ label: "012_", value: 1000 },
                                    { label: "01_", value: 100 },
                                    { label: "0_", value: 10 }].map((p, index) => (
                                        <FormControlLabel
                                            key={index}
                                            control={<Radio
                                                size='small'
                                                checked={p.value === randomNumber}
                                                color="info" />}
                                            label={randomPasswordWord + p.label}
                                            name="digits"
                                            onChange={() => setRandomNumber(p.value)} />
                                    ))}</div>
                                : null}
                        </div>
                    </div></> : null}

                {/* Password form */}
                <form className='user-view-form' onSubmit={submitForm}>
                    {/* Passwords inputs */}
                    <div className={`inputs-wrapper dropdown-div${(!variousPassword ? " dropdown-open" : "")}`}>
                        {formList.length > 0 ? formList.map((n, i) => (
                            <FormControl key={i} className="pr-inputs">
                                <TextField
                                    label={n.label}
                                    name={n.name}
                                    type={showPassword ? "text" : "password"}
                                    variant="outlined"
                                    required
                                    value={form[n.name] || ""}
                                    inputProps={{
                                        maxLength: 20,
                                        minLength: 8,
                                        autoComplete: formList[n.name],
                                        form: { autoComplete: 'off', }
                                    }}
                                    className={(n.regex && regexError) ? "error" : ""}
                                    error={(n.name === "confirmPassword" && noConfirm) || (n.regex && regexError) || errors?.indexOf(n.name) > -1}
                                    placeholder={n.placeholder}
                                    disabled={load || (n.name === "confirmPassword" && !form.password) || confirmSubmit || variousPassword}
                                    onChange={valueChangeHandler}
                                    onBlur={() => validateField(n.name)}
                                />
                            </FormControl>)) : null}
                    </div>

                    <div className='buttons-wrapper'>
                        {/* Change the password input type */}
                        {variousPassword ? null : <FormControlLabel className='checkbox'
                            control={<Checkbox
                                size='small'
                                checked={showPassword}
                                onClick={() => setShowPassword(!showPassword)} />}
                            label="Visa lösenord" />}

                        {/* Generate password button */}
                        <Tooltip arrow
                            title={dslGenerate ? "Lösenords kategory är inte vald." : ""}
                            classes={{
                                tooltip: `tooltip tooltip-margin tooltip-${dslGenerate ? 'error' : 'blue'}`,
                                arrow: `arrow-${dslGenerate ? 'error' : 'blue'}`
                            }}>
                            <span>
                                <Button variant="text"
                                    color="primary"
                                    type="button"
                                    size="small"
                                    className="generate-password"
                                    onClick={() => generatePassword()}
                                    disabled={load || dslGenerate}>
                                    Generera {previewList.length > 0 ? "andra " : ""} lösenord
                                </Button>
                            </span>
                        </Tooltip>

                        <div className='buttons-interior-wrapper'>
                            {/* Reset button */}
                            <Button variant="contained"
                                color="error"
                                type="button"
                                disabled={load || ((form.password + form.confirmPassword).length === 0 && !variousPassword)}
                                onClick={() => resetForm(true)}
                            ><ClearOutlined /></Button>

                            {/* Submit/Preview form {variousPassword ? "contained" : "outlined"} */}
                            <Button variant="contained"
                                ref={refSubmit}
                                className='button-btn'
                                color="primary"
                                type='submit'
                                disabled={load || (!variousPassword && (noConfirm || regexError)) || (variousPassword && previewList.length === 0)}>
                                {load ? <CircularProgress style={{ width: "15px", height: "15px", marginTop: "3px" }} /> : (variousPassword ? "Granska" : buttonText)}</Button>
                        </div>
                    </div>

                </form>
            </div>

            {/* Preview the list of generated passwords */}
            {multiple && users.length > 0
                ? <ModalHelpTexts
                    arr={previewList}
                    cls={" none"}
                    isTitle={`${title} <span class='typography-span'>${location}</span>`}
                    isTable={true}
                    isSubmit={true}
                    setPreview={() => setPreview(false)}
                    regeneratePassword={() => generatePassword(true)}
                    inverseFunction={(save) => (save ? saveApply() : refSubmit.current.click())}
                    ref={refModal} /> : null}

            {/* Save document to pdf */}
            {savePdf ? <PDFConverter
                name={title}
                subTitle={location}
                names={["Namn", "Lösenord"]}
                list={previewList}
                savedPdf={(pdf) => setSavedPdf(pdf)}
            /> : null}
        </>}
</div>
```

[comment]: <> Place this code into constructor before constructor close collaborate in Login.js
``` js
this.loginWithWindowsCredentials = this.loginWithWindowsCredentials.bind(this);
```

[comment]: <> Place this function after or before submit function in Login.js
``` js
loginWithWindowsCredentials() {
    sessionStorage.removeItem("login");
    this.props.history.push("/");
}
```
[comment]: <> Place this code after submit button code in Login.js
```js
<Button variant='text'
    color="primary"
    type="button"
    title="Logga in med Windows-autentiseringsuppgifter"
    onClick={this.loginWithWindowsCredentials}
    disabled={load}>
    <DesktopWindows />
</Button>
```
### - end Reactjs

### CSS
[comment]: <> Put this ccs code into custom.css file
``` css
/* Home */
.loading {
  margin-bottom: 30px;
}

.login-link {
  font-size: 12px !important;
  margin-top: 25px !important;
}
.access-response {
  font-family: monospace;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.43;
  letter-spacing: 1px;
  color: rgb(30, 70, 32);
}
```
### - end css
