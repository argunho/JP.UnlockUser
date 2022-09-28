import React, { Component } from 'react';
import { Container } from 'reactstrap';
import Header from './blocks/Header';

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
