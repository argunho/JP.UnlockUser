import React, { Component } from 'react';
import axios from 'axios';
import {
    Button, CircularProgress, FormControl,
    InputLabel, MenuItem, RadioGroup, Select, TextField
} from '@mui/material';
import { withRouter } from 'react-router-dom'
import Response from './../blocks/Response';

import './../../css/login.css';
import keys from './../../images/keys.png';

export class Login extends Component {
    static displayName = Login.name;

    constructor(props) {
        super(props);

        this.state = {
            form: {
                username: "",
                password: "",
                group: ""
            },
            formFields: [
                { label: "Användarnamn", name: "username", type: "text" },
                { label: "Lösenord", name: "password", type: "password" }
            ],
            response: null,
            load: false
        }
    }

    componentDidMount() {
        const token = sessionStorage.getItem("token");
        if (token !== null && token !== undefined)
            this.props.history.push("/find-user");
    }

    valueChangeHandler = (e) => {
        this.setState({
            form: {
                ...this.state.form, [e.target.name]: e.target.value
            },
            response: null
        })
    }

    submitForm = async (e) => {
        e.preventDefault();
        const { form } = this.state; 

        this.setState({ load: true, response: null })

        await axios.post("auth", form).then(res => {
            const { alert, token, errorMessage } = res.data;

            let success = alert === "success";
            this.setState({
                load: success, response: res.data
            })

            if (success) {
                sessionStorage.setItem("group", form.group);
                sessionStorage.setItem("token", token);

                setTimeout(() => {
                    this.props.history.push("/find-user");
                }, 1000)
            } else if (errorMessage)
                console.error("Error response => " + errorMessage);
        }, error => {
            this.setState({ load: true });
            console.error("Error => " + error);
        })
    }

    render() {
        const { load, response, formFields, form } = this.state;
        return (
            <form className='login-form' onSubmit={this.submitForm}>
                <p className='form-title'>Logga in</p>
                {response != null && <Response response={response} reset={() => this.setState({ response: null })} />}
                {formFields.map((x, i) => (
                    <FormControl key={i}>
                        <TextField
                            label={x.label}
                            name={x.name}
                            type={x.type}
                            value={form[x.name]}
                            variant="outlined"
                            required
                            inputProps={{
                                maxLength: 20,
                                minLength: 5,
                                autoComplete: form[x.name],
                                form: { autoComplete: 'off', }
                            }}
                            disabled={load}
                            onChange={this.valueChangeHandler} />
                    </FormControl>
                ))}

                {/* Radio buttons to choose one of the search alternatives */}
                <FormControl className='checkbox-block-mobile' style={{ display: "inline-block" }}>
                    <RadioGroup row name="row-radio-buttons-group">
                        {/* Loop of radio input choices */}
                        <FormControl variant="standard" sx={{ minWidth: 120 }}>
                            <InputLabel>Hantera</InputLabel>
                            <Select
                                name="group"
                                value={form.group}
                                onChange={this.valueChangeHandler}
                                label="Age"
                                disabled={load}
                                className='login-label'
                                required
                            >
                                {["Studenter", "Politiker", "Personal"].map((name, index) => (
                                    <MenuItem key={index} className='login-group-choice' value={name}>{name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </RadioGroup>
                </FormControl>

                <Button variant="outlined"
                    className='button-btn'
                    color="inherit"
                    type="submit"
                    title="Logga in"
                    disabled={load || form.username.length < 5 || form.password.length < 5 || form.group.length < 1} >
                    {load ? <CircularProgress style={{ width: "12px", height: "12px", marginTop: "3px" }} /> : "Skicka"}</Button>
                <img src={keys} alt="UnlockUser" className='login-form-img' />
            </form>
        )
    }
}

export default withRouter(Login);