import React, { Component } from 'react';
import { Route } from 'react-router';
import { Layout } from './components/Layout';
import { Switch, withRouter } from 'react-router-dom';
import { Login } from './components/pages/Login';
import { UserManager } from './components/pages/UserManager';
import UsersManager from './components/pages/UsersManager';
import { Search } from './components/pages/Search';

import './css/custom.css'
import NotFound from './components/pages/NotFound';
import Contacts from './components/pages/Contacts';
import LogFiles from './components/pages/LogFiles';
import Members from './components/pages/Members';
import TokenConfig from './components/functions/TokenConfig';
import SessionHistory from './components/pages/SessionHistory';

class App extends Component {
  static displayName = App.name;

  constructor() {
    super();
    this.state = {
      group: sessionStorage.getItem("group")
    };
  }

  componentDidMount() {
    this.setState({ isAuthorized: TokenConfig(true) })
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      setTimeout(() => {
        this.setState({ isAuthorized: TokenConfig(true) })
      }, 100)
    }
  }

  render() {
    const {group, isAuthorized} = this.state;

    return (
      <Layout isAuthorized={isAuthorized} group={group}>
        <Switch>
          <Route exact path={['/', '/login']} render={(props) => <Login {...props} updateState={(val) => this.setState({group: val})} />} />
          <Route exact path='/find-user' render={(props) => <Search {...props} group={group} />} />
          <Route exact path='/manage-user/:id' render={(props) => <UserManager {...props} group={group} />}/>
          <Route exact path='/manage-users/:cls/:school' render={(props) => <UsersManager {...props} group={group} />}/>
          <Route exact path='/history' component={SessionHistory} />
          <Route exact path='/logfiles' component={LogFiles} />
          <Route exact path='/contact' component={Contacts} />
          <Route exact path='/members/:office/:department' render={(props) => <Members {...props} group={group} />} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    );
  }
}

export default withRouter((props) => <App {...props} />);