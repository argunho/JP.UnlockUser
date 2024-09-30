import React, { Component } from 'react';
import { Route } from 'react-router';
import { Switch, withRouter } from 'react-router-dom';

// Layout
import { Layout } from './Layout';

// Pages
import Login from './pages/Login';
import Search from './pages/Search';
import UserManager from './pages/UserManager';
import UsersManager from './pages/UsersManager';
import SessionHistory from './pages/SessionHistory';
import LogFiles from './pages/LogFiles';
import Contacts from './pages/Contacts';
import Members from './pages/Members';
import NotFound from './pages/NotFound';

// Functions
import TokenConfig from './services/TokenConfig';

// Css
import './assets/css/custom.css'

class App extends Component {
  static displayName = App.name;

  constructor() {
    super();
    this.state = {
      currentGroup: sessionStorage.getItem("group") ?? "",
      loading: false
    };
  }

  componentDidMount() {  
    this.setState({ 
      isAuthorized: TokenConfig(true),
      loading: false
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      setTimeout(() => {
        this.setState({ isAuthorized: TokenConfig(true) })
      }, 100)
    }
  }

  updateGroup = (value) => {
    sessionStorage.setItem("group", value);
    this.setState({ 
      currentGroup: value,
      loading: true
    });
  }

  render() {
    const { currentGroup, isAuthorized, loading } = this.state;
    const group = currentGroup?.toLowerCase();

    return (
      <Layout isAuthorized={isAuthorized} >
        <Switch>
          {!isAuthorized && <Route exact path={['/', '/login']} render={(props) => <Login {...props} updateGroup={this.updateGroup} />} />}
          {isAuthorized && <>
            <Route exact path='/find-user' render={(props) => <Search {...props} group={currentGroup} updateGroup={this.updateGroup} />} />
            <Route exact path='/members' render={(props) => <Search {...props} group={currentGroup} updateGroup={this.updateGroup} />} />
            <Route exact path='/manage-user/:id' render={(props) => <UserManager {...props} group={group} />} />
            <Route exact path='/manage-users/:cls/:school' render={(props) => <UsersManager {...props} group={group} />} />
            <Route exact path='/history' component={SessionHistory} />
            <Route exact path='/logs' component={LogFiles} />
            <Route exact path='/contact' component={Contacts} />
            <Route exact path='/members/:office/:department' render={(props) => <Members {...props} group={group} />} />
          </>}
          {!loading && <Route component={NotFound} />}
        </Switch>
      </Layout>
    );
  }
}

export default withRouter((props) => <App {...props} />);