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
    return (
      <Layout isAuthorized={this.state.isAuthorized}>
        <Switch>
          <Route exact path={['/', '/login']} component={Login} elem />
          <Route exact path='/find-user' component={Search} />
          <Route exact path='/manage-user/:id' component={UserManager} />
          <Route exact path='/manage-users/:cls/:school' component={UsersManager} />        
          <Route exact path='/contact' component={Contacts} />      
          <Route exact path='/logfiles' component={LogFiles} />      
          <Route exact path='/members/:office/:department' component={Members} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    );
  }
}

export default withRouter((props) => <App {...props} />);