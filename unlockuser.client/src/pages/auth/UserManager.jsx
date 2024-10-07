
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

// Installed
import { Lock, LockOpen } from '@mui/icons-material';
import { Button, CircularProgress } from '@mui/material';

// Components
import Form from '../components/Form';
import Info from '../components/Info';
import Response from '../components/Response';
import Loading from '../components/Loading';

// Services
import ApiRequest from '../services/ApiRequest';

// Css
import './../assets/css/userview.css';

export class UserManager extends Component {
    static displayName = UserManager.name;
    constructor(props) {
        super(props);

        this.state = {
            name: this.props.match.params?.id || null,
            user: {
                name: "Anvädarprofil",
                displayName: null,
                email: null,
                office: null,
                department: null,
                isLocked: false,
                passwordLength: 0
            },
            response: null,
            load: false,
            noAccess: false,
            disabled: false,
            userIsFound: false,
            isResult: false
        }

        this.unlockUser = this.unlockUser.bind(this);
    }

    componentDidMount() {
        this.getUser();
  
        document.title = "UnlockUser | Användare";
    }

    async getUser() {

        const id = this.state.name;
        if (id === undefined || id === null || id === "undefined") {
            this.setResponse();
            return;
        }

        await ApiRequest("user/" + this.props.group + "/" + id).then(res => {
            const { user, passwordLength } = res.data;

            if (user !== undefined && user !== null) {
                this.setState({
                    user: {
                        name: user?.name,
                        displayName: user.displayName,
                        email: user.email,
                        office: user?.office,
                        department: user?.department,
                        isLocked: user.isLocked,
                        passwordLength: passwordLength,
                        subTitle: user?.office + (user.office !== user.department ? (" " + user?.department) : "")
                    },
                    userIsFound: true,
                    isResult: true
                })
            } else
                this.setResponse();
        }, error => {
            if (error?.response?.status === 401) {
                this.setState({ noAccess: true });

                setTimeout(() => {
                    this.props.navigate("/");
                }, 3000)
            } else
                console.error("Error => " + error.response)
        })
    }

    // Set response
    setResponse() {
        this.setState({
            response: {
                alert: "warning",
                msg: "Användaren hittades inte."
            },
            isResult: true
        });
    }

    // Unlock user
    unlockUser = async () => {
        this.setState({ load: true, response: null })

        // Request
        await ApiRequest("user/unlock/" + this.state.user.name).then(res => {
            this.setState({ load: false, response: res.data })
            this.getUser();
        }, error => {
            // Handle of error
            this.setState({ load: false })
            if (error?.response.status === 401)
                this.setState({ noAccess: true });
            else
                console.error("Error => " + error.response);
        })
    }

    render() {
        const { user, noAccess, load, response, disabled, userIsFound } = this.state;

        return (
            noAccess ? <Response response={null} noAccess={true} />
                : <div className='interior-div'>
                    {/* Info about user */}
                    <Info
                        check={true}
                        user={user}
                        group={this.props.group}
                        displayName={user?.displayName}
                        subTitle={user?.subTitle}
                    />

                    {/* Response */}
                    {response && <Response response={response} reset={() => this.setState({ response: null })} />}

                    {/* Unlock user */}
                    {userIsFound && <>
                        <div className={'unlock-block' + (user.isLocked ? " locked-account" : "")}>
                            {user.isLocked ? <Lock /> : <LockOpen />}
                            <span>{user.isLocked ? "Kontot är låst" : "Aktiv konto"}</span>

                            {/* Unlock user - button */}
                            <Button variant="contained"
                                color="error"
                                disabled={!user.isLocked || load || disabled}
                                onClick={() => this.unlockUser()}
                                className="unlock-btn button-btn">
                                {load ? <CircularProgress style={{ width: "15px", height: "15px", marginTop: "3px" }} /> : "Lås upp"}
                            </Button>
                        </div>
                        
                        {/* Change password */}
                        {(user && !user.isLocked) && <Form
                            title="Återställa lösenord"
                            users={[user]}
                            passwordLength={user.passwordLength} />}
                    </>}

                    {/* Visible image under search progress */}
                    {!userIsFound && <Loading msg="söker efter användardata." img="loading.gif" />}
                </div>
        )
    }
}

export default withRouter(UserManager);