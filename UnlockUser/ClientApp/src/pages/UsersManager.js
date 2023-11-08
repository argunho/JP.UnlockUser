
import React, { Component } from 'react';

// Installed
import { ArrowDropDown, ArrowDropUp, Close } from '@mui/icons-material';
import { Button } from '@mui/material';

// Components
import Form from './../components/Form';
import Info from './../components/Info';

export default class UsersManager extends Component {
    static displayName = UsersManager.name;

    constructor(props) {
        super(props);
        const { cls, school } = this.props.match.params;

        this.state = {
            users: JSON.parse(sessionStorage.getItem("selectedUsers")) ?? [],
            name: "Klass " + cls,
            displayName: school,
            dropdown: false
        }

        this.spliceUsersList = this.spliceUsersList.bind(this);

        
        document.title = "UnlockUser | Användare";
    }

    spliceUsersList = (user) => {
        if (this.state.users.length === 1)
            this.props.history.goBack();
        this.setState({ users: this.state.users.filter(x => x !== user) });
    }

    render() {
        const { name, displayName, dropdown } = this.state;
        const users = this.state.users;
        return (
            <div className='interior-div'>
                <Info
                    name={name}
                    displayName={displayName}
                    group={this.props.groups}
                    subTitle={`${users.length} elev${users.length === 1 ? "" : "er"}`}
                    check={true}
                />

                {/* Edit class members list */}
                <Button variant='text' onClick={() => this.setState({ dropdown: !dropdown })} color={dropdown ? "primary" : "inherit"}>
                    Klassmedlemmar &nbsp;&nbsp;{dropdown ? <ArrowDropUp /> : <ArrowDropDown />}
                </Button>
                <div className={`selected-list dropdown-div ${dropdown ? "dropdown-open" : ""}`}>
                    <p className='tips-p'>Klicka på användare att radera från listan</p>
                    {users.map((user, index) => (
                        <Button variant='outlined' color='inherit' className='button-list' key={index} onClick={() => this.spliceUsersList(user)}>
                            {user.name} <Close fontSize='10' />
                        </Button>
                    ))}
                </div>

                <Form
                    title={"Nya lösenord till " + users?.length + " elev" + (users?.length === 1 ? "er" : "")}
                    // api="resetPasswords"
                    users={users}
                    // multiple={true}
                    passwordLength={8} />
            </div>
        )
    }
}

