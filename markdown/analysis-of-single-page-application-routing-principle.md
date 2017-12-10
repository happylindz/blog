# 剖析单页面应用路由实现原理

[原文地址](https://github.com/happylindz/blog/issues/4)

## 前言

如今 React, Vue 等视图层框架大行其道，为前端开发提供了不少便利性，但是仅仅只是这些的话，缺少完善的前端路由系统，在单页应用中，我们希望能够通过前端路由来控制整个单页面应用，而后端仅仅只是获取数据接口。本文主要围绕以下三个问题来进行阐述：

1. 单页面应用为什么需要路由系统？x`
2. 单页面应用路由实现原理是什么？
3. 如何实现一个简单的 react-router？

接下来我们围绕一个简单的例子展开，通过路由原理将其实现。

如果觉得本文有帮助，可以点 star 鼓励下，本文所有代码都可以从 github 仓库下载，读者可以按照下述打开:

```bash
git clone https://github.com/happylindz/blog.git
cd blog/code/router
yarn
```
建议你 clone 下来，方便你阅读代码，跟我一起测试查看效果。

## 为什么需要路由系统

最开始的时候网页都是多页面的，后来随着 ajax 技术的出现，才慢慢有了像 React、Vue 等 SPA 框架，当然，缺少路由系统的 SPA 框架有其存在的弊端：

1. 用户在使用过程中，url 不会发生变化，那么用户在进行多次跳转之后，如果一不小心刷新了页面，又会回到最开始的状态，用户体验极差。
2. 由于缺乏路由，不利于 SEO，搜索引擎进行收录。

主流的前端路由系统是通过 hash 或 history 来实现的，下面我们一探究竟。

## Hash 路由

url 上的 hash 以 # 开头，原本是为了作为锚点，方便用户在文章导航到相应的位置。因为 hash 值的改变不会引起页面的刷新，聪明的程序员就想到用 hash 值来做单页面应用的路由，并且当 url 的 hash 发生变化的时候，可以触发相应 hashchange 回调函数。

所以我们可以写一个 Router 对象，代码如下：

```javascript
class Router {
  constructor() {
    this.routes = {};
    this.currentUrl = '';
  }
  route(path, callback) {
    this.routes[path] = callback || function() {};
  }
  updateView() {
    this.currentUrl = location.hash.slice(1) || '/';
    this.routes[this.currentUrl] && this.routes[this.currentUrl]();
  }
  init() {
    window.addEventListener('load', this.updateView.bind(this), false);
    window.addEventListener('hashchange', this.updateView.bind(this), false);
  }
}
```

1. routes 用来存放不同路由对应的回调函数
2. init 用来初始化路由，在 load 事件发生后刷新页面，并且绑定 hashchange 事件，当 hash 值改变时触发对应回调函数

```html
<div id="app">
  <ul>
    <li>
      <a href="#/">home</a>
    </li>
    <li>
      <a href="#/about">about</a>
    </li>
    <li>
      <a href="#/topics">topics</a>
    </li>
  </ul>
  <div id="content"></div>
</div>
<script src="js/router.js"></script>
<script>
  const router = new Router();
  router.init();
  router.route('/', function () {
    document.getElementById('content').innerHTML = 'Home';
  });
  router.route('/about', function () {
    document.getElementById('content').innerHTML = 'About';
  });
  router.route('/topics', function () {
    document.getElementById('content').innerHTML = 'Topics';
  });
</script>
```

在对应 html 中，只要将所有链接路径前加 # 即可做成软路由，而不去触发刷新页面。

读者可以尝试并查看效果：

```
yarn hash
// open http://localhost:8080
```

![](https://raw.githubusercontent.com/happylindz/blog/master/images/router/1.gif)

值得注意的是在第一次进入页面的时候，需要触发一次 onhashchange 事件，保证页面能够正常显示，用 hash 在做路由跳转的好处在于简单实用，便于理解，但是它虽然解决解决单页面应用路由控制的问题，但是在 url 却引入 # 号，不够美观。

## History 路由

History 路由是基于 HTML5 规范，在 HTML5 规范中提供了 ```history.pushState || history.replaceState``` 来进行路由控制。

当你执行 ```history.pushState({}, null, '/about')``` 时候，页面 url 会从 ```http://xxxx/``` 跳转到 ```http://xxxx/about``` 可以在改变 url 的同时，并不会刷新页面。

先来简单看看 pushState 的用法，参数说明如下：

1. state：存储 JSON 字符串，可以用在 popstate 事件中
2. title：现在大多浏览器忽略这个参数，直接用 null 代替
3. url：任意有效的 URL，用于更新浏览器的地址栏

这么说下来 history 也有着控制路由的能力，然后，hash 的改变可以出发 onhashchange 事件，而 history 的改变并不会触发任何事件，这让我们无法直接去监听 history 的改变从而做出相应的改变。

所以，我们需要换个思路，我们可以罗列出所有可能触发 history 改变的情况，并且将这些方式一一进行拦截，变相地监听 history 的改变。

对于一个应用而言，url 的改变(不包括 hash 值得改变)只能由下面三种情况引起：

1. 点击浏览器的前进或后退按钮
2. 点击 a 标签
3. 在 JS 代码中触发 ```history.push(replace)State``` 函数

只要对上述三种情况进行拦截，就可以变相监听到 history 的改变而做出调整。针对情况 1，HTML5 规范中有相应的 onpopstate 事件，通过它可以监听到前进或者后退按钮的点击，值得注意的是，调用 ```history.push(replace)State``` 并不会触发 onpopstate 事件。

经过分析，下面就简单实现一个 history 路由系统，代码如下：

```javascript
class Router {
  constructor() {
    this.routes = {};
    this.currentUrl = '';
  }
  route(path, callback) {
    this.routes[path] = callback || function() {};
  }
  updateView(url) {
    this.currentUrl = url;
    this.routes[this.currentUrl] && this.routes[this.currentUrl]();
  }
  bindLink() {
    const allLink = document.querySelectorAll('a[data-href]');
    for (let i = 0, len = allLink.length; i < len; i++) {
      const current = allLink[i];
      current.addEventListener(
        'click',
        e => {
          e.preventDefault();
          const url = current.getAttribute('data-href');
          history.pushState({}, null, url);
          this.updateView(url);
        },
        false
      );
    }
  }
  init() {
    this.bindLink();
    window.addEventListener('popstate', e => {
      this.updateView(window.location.pathname);
    });
    window.addEventListener('load', () => this.updateView('/'), false);
  }
}
```

Router 跟之前 Hash 路由很像，不同的地方在于 init 初始化函数，首先需要获取所有特殊的链接标签，然后监听点击事件，并阻止其默认事件，触发 history.pushState 以及更新相应的视图。

另外绑定 popstate 事件，当用户点击前进或者后退的按钮时候，能够及时更新视图，另外当刚进去页面时也要触发一次视图更新。

修改相应的 html 内容

```html
<div id="app">
  <ul>
    <li><a data-href="/" href="#">home</a></li>
    <li><a data-href="/about" href="#">about</a></li>
    <li><a data-href="/topics" href="#">topics</a></li>
  </ul>
  <div id="content"></div>
</div>
<script src="js/router.js"></script>
<script>
  const router = new Router();
  router.init();
  router.route('/', function() {
    document.getElementById('content').innerHTML = 'Home';
  });
  router.route('/about', function() {
    document.getElementById('content').innerHTML = 'About';
  });
  router.route('/topics', function() {
    document.getElementById('content').innerHTML = 'Topics';
  });
</script>
```

跟之前的 html 基本一致，区别在于用 data-href 来表示要实现软路由的链接标签。

当然上面还有情况 3，就是你在 JS 直接触发 pushState 函数，那么这时候你必须要调用视图更新函数，否则就是出现视图内容和 url 不一致的情况。

```javascript
setTimeout(() => {
  history.pushState({}, null, '/about');
  router.updateView('/about');
}, 2000);
```

读者可以尝试并查看效果：

```
yarn history
// open http://localhost:8080
```

![](https://raw.githubusercontent.com/happylindz/blog/master/images/router/2.gif)

## React-router 用法

React-router 的版本从 2 到 3 再到现在的 4， API 变化天翻地覆，这里我们以最新的 v4 来举例。

在 v4 版本中，提供的路由能力都是以组件的形式进行呈现，由 ```react-router-dom``` 来提供，你不需再安装 ```react-router```，因为 ```react-router-dom``` 已经包含了这个库。下面先通过 ```react-router-dom``` 写一个简单的例子。

```javascript
import { BrowserRouter as Router, Link, Route } from 'react-router-dom';
const HomeView = () => <div>Home</div>;
const AboutView = () => <div>About</div>;
const TopicsView = ({ match }) => (<div>
  <h2>Topics</h2>
  <ul>
    <li><Link to={`${match.url}/topic1`} >Topic1</Link></li>
    <li><Link to={`${match.url}/topic2`} >Topic2</Link></li>
    <li><Link to={`${match.url}/topic3`} >Topic3</Link></li>
  </ul>
  <Route path={ `${match.url}/topic1` } component={ () => <div>Topic1</div> } /> 
  <Route path={ `${match.url}/topic2` } component={ () => <div>Topic2</div> } /> 
  <Route path={ `${match.url}/topic3` } component={ () => <div>Topic3</div> } /> 
</div>)

class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <ul>
            <li><Link to="/">home</Link></li>
            <li><Link to="/about">about</Link></li>
            <li><Link to="/topics">topics</Link></li>
          </ul>
          <Route exact path="/" component={HomeView} />
          <Route path="/about" component={AboutView} />
          <Route path="/topics" component={TopicsView} />
          <Route component={() => <div>Always show</div>} />
        </div>
      </Router>
    );
  }
}
```

这是 RR4 的标准用法，实际运行效果如下：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/router/3.gif)

可以看出，当 path 匹配上路由时则显示 component，匹配不上则不显示，如果没有 path 字段则默认一直显示，而 exact 字段则表示必须要完全匹配，避免像 ```path='/'``` 匹配上 ```path='/about'``` 这样的情况。

所谓的局部刷新，其本质在于：当路由发生变化时，跟当前 url 匹配的 component 正常渲染，跟当前 url 不匹配的 component 渲染为 null，没错，就是这么简单粗暴。

有了奋斗的方向后，下面我们就围绕了如何构建 Router，Link，Route 这三个组件来实现 Hash 和 History 的前端路由系统。

## 基于 React 的 Hash 路由系统

有了前面的理论基础，相信实现基于 React 的 Hash 路由系统应该不是什么难事吧，首先是 Link 组件的实现：

```javascript
export class Link extends Component {
  render() {
    const { to, children } = this.props;
    return <a href={`#${to}`}>{children}</a>;
  }
}
```

简单地返回一个 a 标签，并且在链接前面加 # 代表软路由，并不是真正意义的跳转。接着是 Route 组件的实现：

```javascript
export class Route extends Component {
  componentWillMount() {
    window.addEventListener('hashchange', this.updateView, false);
  }
  componentWillUnmount() {
    window.removeEventListener('hashchange', this.updateView, false);
  }
  updateView = () => {
    this.forceUpdate();
  }
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
```

实现的方式也不难：

1. 当注册 Route 组件的时候，将组件更新的回调函数添加到 hashchange 事件中，而组件卸载时候移除组件更新的回调函数避免内存泄漏。
2. 这样当页面 hash 值变化时就会触发所有注册的回调函数的执行，使所有 Route 组件都去更新实例。
3. 在 render 函数的实现中，有个 matchPath 函数来判断当前路径是否与该组件对应的路径匹配，如果匹配不上，则返回 null，如果匹配上了，就渲染该 Route 组件对应的 Component 组件。

至于这个 matchPath 的实现：

```javascript
function matchPath(hash, options) {
  // 截断 hash 首位的 #
  hash = hash.slice(1);
  const { exact = false, path } = options;
  // 如果没有传入 path，代表始终匹配
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
```

这样一个简单的 Hash 路由就已经实现了，当然，我们在初次加载页面的时候 hash 值是不带 /，所以导致无法加载 Index 组件，所以我们在 HashRouter 组件中添加一次 hash 的变化，这样就保证的首次加载页面的准确性。

```javascript
export class HashRouter extends Component {
  componentDidMount() {
    window.location.hash = '/';
  }
  render() {
    return this.props.children;
  }
}
```

到目前为止，基于 React 的 Hash 路由系统就已经实现了，我们可以将之前 React-router 的例子拿来进行测试，别忘了将组件引入路径改成我们自己写好的目录，读者也可以自己手动进行尝试。

```bash
cd hash_router_with_react/
yarn 
yarn start 
```

实现效果如下：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/router/4.gif)

基于 React 的 Hash 路由系统实现比较简单，而 History 版的就会相对复杂一些，下面就来实现吧。

## 基于 React 的 History 路由系统

根据前面的 history 路由的实现，基于 React 的路由也是十分类似。

![](https://raw.githubusercontent.com/happylindz/blog/master/images/router/5.png)

图片出处：[单页面应用路由实现原理：以 React-Router 为例](https://github.com/youngwind/blog/issues/109)

大致分为两步：

1. 在初始化的过程中，将所有 Route 实例添加到一个 instances 数组，并且为每个组件都绑定 popstate 事件。
2. 在三种触发路由更新的途径结束后，遍历所有 instances 中的实例，强制重新渲染，从而达到更新的目的。

代码实现如下：首先是创建 instances 数组

```javascript
// 注册 component 实例
const instances = [];
const register = (component) => instances.push(component);
const unregister = (component) => instances.splice(instances.indexOf(component), 1);
```

Route 组件大致相同，不同在于注册和卸载钩子函数的不同：初始化时需添加到 instances 中和绑定 popstate 事件。

```javascript
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
  // ...
}
```

Link 组件实现：需要阻止默认事件并且当点击的时候需要广播所有实例强制触发更新。

```javascript
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
```

其它的内容跟之前的 Hash 路由差不多，读者可以自行查看：

```
cd history_router_with_react/
yarn 
yarn start 
```

实现效果：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/router/6.gif)

虽然点击前进后退按钮并不会触发所有组件更新，但上面的实现效果可能也不太优雅，因为单页应用中如果存在大量 Route 组件时，每次点击 Link 链接时候都需要迫使所有 Route 组件进行重渲染。

本文到这差不多就结束了，本文围绕着构建 hash 路由和 history 路由为线索，并最后实现了玩具版的 React-router，阐述现在主流单页面应用路由实现原理，有兴趣的建议阅读下源码，相信会有其他收获。

参考文章：

* [前端路由实现与 react-router 源码分析](https://github.com/joeyguo/blog/issues/2)
* [单页面应用路由实现原理：以 React-Router 为例](https://github.com/youngwind/blog/issues/109)
* [由浅入深地教你开发自己的 React Router v4](http://www.bijishequ.com/detail/366583?p=)