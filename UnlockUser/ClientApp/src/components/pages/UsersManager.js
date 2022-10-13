import { Close } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React, { Component } from 'react'
import Form from '../blocks/Form';
import Info from '../blocks/Info';

export default class UsersManager extends Component {
    static displayName = UsersManager.name;

    constructor(props) {
        super(props);
        const { cls, school } = this.props.match.params;
        const users = JSON.parse(sessionStorage.getItem("selectedUsers")) ?? [];
        this.state = {
            users: users,
            name: "Klass " + cls,
            displayName: school
        }

        this.spliceUsersList = this.spliceUsersList.bind(this);
    }

    spliceUsersList = (user) => {
        this.setState({ users: this.state.users.filter(x => x !== user) })
    }

    render() {
        const { users, name, displayName } = this.state;

        return (
            <div className='interior-div'>
                <Info
                    name={name}
                    displayName={displayName}
                    subTitle={`${users.length} elev${users.length === 1 ? "" : "er"}`}
                    check={true}
                />

                {users?.length > 0 &&
                    <ul className='selected-list'>
                        {users.map((user, index) => (
                            <Tooltip arrow
                                key={index}
                                title={<pre>Klicka här, att radera <b><font color="#000000">{user.displayName}</font></b> från listan</pre>}
                                classes={{ tooltip: "tooltip tooltip-error tooltip-margin", arrow: "arrow-error" }}>
                                <li onClick={() => this.spliceUsersList(user)}>
                                    {user.name} <Close fontSize='10' />
                                </li>
                            </Tooltip>
                        ))}
                    </ul>}

                <Form title={"Nya lösenord till " + users?.length + " elev" + (users?.length === 1 ? "er" : "")}
                    api="resetPasswords"
                    users={users}
                    multiple={true}
                    passwordLength={8} />
            </div>
        )
    }
}

