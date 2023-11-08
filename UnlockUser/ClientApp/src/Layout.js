import React, { Component } from 'react';

// Installed
import { Container } from '@mui/material';

// Components
import Header from './components/Header';


export class Layout extends Component {
  static displayName = Layout.name;

  render () {
    
    return (
      <>
        <Header isAuthorized={this.props?.isAuthorized}/>
        <Container>
          {this.props.children}
        </Container>
      </>
    );
  }
}
