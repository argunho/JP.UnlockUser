import { Cancel, Close } from '@mui/icons-material';
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
            cls: {
                name: "Klass " + cls,
                displayName: school,
                users: users,
                subTitle: `${users.length} elev${users.length === 1 ? "" : "er"}`
            }
        }
    }

    spliceUsersList(x) {
        console.log(x)
        const { users } = this.state;
        this.setState({
            users: users.splice(users.indexOf(x.name), -1)
        })
    }

    render() {
        const { cls, users } = this.state;

        return (
            <div className='interior-div'>
                <Info
                    name={cls?.name}
                    displayName={cls?.displayName}
                    subTitle={cls?.subTitle}
                    check={true}
                />

                {users.length > 0 &&
                    <ul className='selected-list'>
                        {users.map((x, index) => (
                            <Tooltip arrow
                                key={index}
                                title={`Klicka här, att radera ${x.name} från listan`}
                                classes={{ tooltip: "tooltip tooltip-error tooltip-margin", arrow: "arrow-error" }}>
                                <li onClick={() => this.spliceUsersList(x)}>
                                    {x.name} <Close fontSize='10' />
                                </li>
                            </Tooltip>
                        ))}
                    </ul>}

                <Form title={"Nya lösenord till " + users.length + " elev" + (users.length === 1 ? "er" : "")}
                    api="resetPasswords"
                    users={users}
                    multiple={true}
                    passwordLength={8} />
            </div>
        )
    }
}

