import React, { Component } from 'react';

function matchPath(hash, options) {
  hash = hash.slice(1);
  const { exact = false, path } = options;
  if (!path) {
    return {
      path: null,
      url: hash,
      isExact: true
    };
  }
  const match = new RegExp(path).exec(hash);
  if (!match) {
    // 什么都没匹配上
    return null;
  }
  const url = match[0];
  const isExact = hash === url;

  if (exact && !isExact) {
    // 匹配上了，但不是精确匹配
    return null;
  }
  return {
    path,
    url,
    isExact
  };
}

export class HashRouter extends Component {
  componentDidMount() {
    window.location.hash = '/';
  }
  render() {
    return this.props.children;
  }
}

export class Route extends Component {
  componentWillMount() {
    window.addEventListener('hashchange', this.updateView, false);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.updateView, false);
  }

  updateView = () => {
    this.forceUpdate();
  };

  render() {
    const { path, exact, component } = this.props;
    const match = matchPath(window.location.hash, { exact, path });
    if (!match) {
      return null;
    }
    if (component) {
      return React.createElement(component, { match });
    }
    return null;
  }
}

export class Link extends Component {
  render() {
    const { to, children } = this.props;
    return <a href={`#${to}`}>{children}</a>;
  }
}
