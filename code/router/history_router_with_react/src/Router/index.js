import React, { Component } from 'react';

// 注册 component 实例
const instances = [];
const register = component => instances.push(component);
const unregister = component => instances.splice(instances.indexOf(component), 1);

function matchPath(pathname, options) {
  const { exact = false, path } = options;
  if (!path) {
    return {
      path: null,
      url: pathname,
      isExact: true
    };
  }
  const match = new RegExp(`^${path}`).exec(pathname);
  if (!match) {
    // 什么都没匹配上
    return null;
  }
  const url = match[0];
  const isExact = pathname === url;
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

export class BrowserRouter extends Component {
  render() {
    return this.props.children;
  }
}

export class Route extends Component {
  componentWillMount() {
    window.addEventListener('popstate', this.handlePopState);
    register(this);
  }
  componentWillUnmount() {
    window.removeEventListener('popstate', this.handlePopState);
    unregister(this);
  }
  handlePopState = () => {
    this.forceUpdate();
  };
  render() {
    const { path, exact, component } = this.props;
    const match = matchPath(window.location.pathname, { path, exact });
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
  handleClick = e => {
    e.preventDefault();
    const { to } = this.props;
    window.history.pushState({}, null, to);
    instances.forEach(instance => instance.forceUpdate());
  };
  render() {
    const { to, children } = this.props;
    return (
      <a href={to} onClick={this.handleClick}>
        {children}
      </a>
    );
  }
}
