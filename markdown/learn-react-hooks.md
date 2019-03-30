[原文地址](https://github.com/happylindz/blog/issues/19)

# 十个案例学会 React Hooks

## 前言

在 React 的世界中，有容器组件和 UI 组件之分，在 React Hooks 出现之前，UI 组件我们可以使用函数，无状态组件来展示 UI，而对于容器组件，函数组件就显得无能为力，我们依赖于类组件来获取数据，处理数据，并向下传递参数给 UI 组件进行渲染。在我看来，使用 React Hooks 相比于从前的类组件有以下几点好处：

1. 代码可读性更强，原本同一块功能的代码逻辑被拆分在了不同的生命周期函数中，容易使开发者不利于维护和迭代，通过 React Hooks 可以将功能代码聚合，方便阅读维护
2. 组件树层级变浅，在原本的代码中，我们经常使用 HOC/render props 等方式来复用组件的状态，增强功能等，无疑增加了组件树层数及渲染，而在 React Hooks 中，这些功能都可以通过强大的自定义的 Hooks 来实现

React 在 v16.8 的版本中推出了 React Hooks 新特性，虽然社区还没有最佳实践如何基于 React Hooks 来打造复杂应用(至少我还没有)，凭借着阅读社区中大量的关于这方面的文章，下面我将通过十个案例来帮助你认识理解并可以熟练运用 React Hooks 大部分特性。

## useState 保存组件状态

在类组件中，我们使用 ```this.state``` 来保存组件状态，并对其修改触发组件重新渲染。比如下面这个简单的计数器组件，很好诠释了类组件如何运行：[在线 Demo](https://codesandbox.io/s/ojk1oloq9z)

```javascript
import React from "react";
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0,
      name: "alife"
    };
  }
  render() {
    const { count } = this.state;
    return (
      <div>
        Count: {count}
        <button onClick={() => this.setState({ count: count + 1 })}>+</button>
        <button onClick={() => this.setState({ count: count - 1 })}>-</button>
      </div>
    );
  }
}
```

一个简单的计数器组件就完成了，而在函数组件中，由于没有 this 这个黑魔法，React 通过 useState 来帮我们保存组件的状态。[在线 Demo](https://codesandbox.io/s/ojk1oloq9z)

```javascript
import React, { useState } from "react";
function App() {
  const [obj, setObject] = useState({
    count: 0,
    name: "alife"
  });
  return (
    <div className="App">
      Count: {obj.count}
      <button onClick={() => setObject({ ...obj, count: obj.count + 1 })}>+</button>
      <button onClick={() => setObject({ ...obj, count: obj.count - 1 })}>-</button>
    </div>
  );
}
```

通过传入 useState 参数后返回一个带有默认状态和改变状态函数的数组。通过传入新状态给函数来改变原本的状态值。**值得注意的是 useState 不帮助你处理状态，相较于 setState 非覆盖式更新状态，useState 覆盖式更新状态，需要开发者自己处理逻辑。(代码如上)**

似乎有个 useState 后，函数组件也可以拥有自己的状态了，但仅仅是这样完全不够。

## useEffect 处理副作用

函数组件能保存状态，但是对于异步请求，副作用的操作还是无能为力，所以 React 提供了 useEffect 来帮助开发者处理函数组件的副作用，在介绍新 API 之前，我们先来看看类组件是怎么做的：[在线 Demo](https://codesandbox.io/s/y29rwpk3z1)

```javascript
import React, { Component } from "react";
class App extends Component {
  state = {
    count: 1
  };
  componentDidMount() {
    const { count } = this.state;
    document.title = "componentDidMount" + count;
    this.timer = setInterval(() => {
      this.setState(({ count }) => ({
        count: count + 1
      }));
    }, 1000);
  }
  componentDidUpdate() {
    const { count } = this.state;
    document.title = "componentDidMount" + count;
  }
  componentWillUnmount() {
    document.title = "componentWillUnmount";
    clearInterval(this.timer);
  }
  render() {
    const { count } = this.state;
    return (
      <div>
        Count:{count}
        <button onClick={() => clearInterval(this.timer)}>clear</button>
      </div>
    );
  }
}
```

在例子中，组件每隔一秒更新组件状态，并且每次触发更新都会触发 document.title 的更新(副作用)，而在组件卸载时修改 document.title（类似于清除）

从例子中可以看到，一些重复的功能开发者需要在 componentDidMount 和 componentDidUpdate 重复编写，而如果使用 useEffect 则完全不一样。[在线 Demo](https://codesandbox.io/s/0x1l4kk6lv)

```javascript
import React, { useState, useEffect } from "react";
let timer = null;
function App() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    document.title = "componentDidMount" + count;
  },[count]);
  
  useEffect(() => {
    timer = setInterval(() => {
      setCount(prevCount => prevCount + 1);
    }, 1000);
    return () => {
      document.title = "componentWillUnmount";
      clearInterval(timer);
    };
  }, []);
  return (
    <div>
      Count: {count}
      <button onClick={() => clearInterval(timer)}>clear</button>
    </div>
  );
}
```

我们使用 useEffect 重写了上面的例子，useEffect 第一个参数传递函数，可以用来做一些副作用比如异步请求，修改外部参数等行为，而第二个参数是个数组，如果数组中的值才会触发 useEffect 第一个参数中的函数。返回值(如果有)则在组件销毁或者调用函数前调用。

1. 比如第一个 useEffect 中，理解起来就是一旦 count 值发生改变，则修改 documen.title 值
2. 而第二个 useEffect 中数组没有传值，代表不监听任何参数变化，即只有在组件初始化或销毁的时候才会触发，用来代替 componentDidMount 和 componentWillUnmount

基于这个强大 Hooks，我们可以模拟封装出其他生命周期函数，比如 componentDidUpdate 代码十分简单

```javascript
function useUpdate(fn) {
    // useRef 创建一个引用
    const mounting = useRef(true);
    useEffect(() => {
      if (mounting.current) {
        mounting.current = false;
      } else {
        fn();
      }
    });
}
```

现在我们有了 useState 管理状态，useEffect 处理副作用，异步逻辑，学会这两招足以应对大部分类组件的使用场景。

## useContext 减少组件层级

上面介绍了 useState、useEffect 这两个最基本的 API，接下来介绍的 useContext 是  React 帮你封装好的，用来处理多层级传递数据的方式，在以前组件树种，跨层级祖先组件想要给孙子组件传递数据的时候，除了一层层 props 往下透传之外，我们还可以使用 React Context API 来帮我们做这件事，举个简单的例子：[在线 Demo](https://codesandbox.io/s/94p24or414)

```javascript
const { Provider, Consumer } = React.createContext(null);
function Bar() {
  return <Consumer>{color => <div>{color}</div>}</Consumer>;
}
function Foo() {
  return <Bar />;
}
function App() {
  return (
    <Provider value={"grey"}>
      <Foo />
    </Provider>
  );
}
```

通过 React createContext 的语法，在 APP 组件中可以跨过 Foo 组件给 Bar 传递数据。而在 React Hooks 中，我们可以使用 useContext 进行改造。[在线 Demo]()

```javascript
const colorContext = React.createContext("gray");
function Bar() {
  const color = useContext(colorContext);
  return <div>{color}</div>;
}
function Foo() {
  return <Bar />;
}
function App() {
  return (
    <colorContext.Provider value={"red"}>
      <Foo />
    </colorContext.Provider>
  );
}
```

传递给 useContext 的是 context 而不是 consumer，返回值即是想要透传的数据了。用法很简单，使用 useContext 可以解决 Consumer 多状态嵌套的问题。[参考例子](https://daveceddia.com/usecontext-hook/)

```javascript
function HeaderBar() {
  return (
    <CurrentUser.Consumer>
      {user =>
        <Notifications.Consumer>
          {notifications =>
            <header>
              Welcome back, {user.name}!
              You have {notifications.length} notifications.
            </header>
          }
      }
    </CurrentUser.Consumer>
  );
}
```

而使用 useContext 则变得十分简洁，可读性更强且不会增加组件树深度。

```javascript
function HeaderBar() {
  const user = useContext(CurrentUser);
  const notifications = useContext(Notifications);
  return (
    <header>
      Welcome back, {user.name}!
      You have {notifications.length} notifications.
    </header>
  );
}
```

## useReducer 

useReducer 这个 Hooks 在使用上几乎跟 Redux/React-Redux 一模一样，唯一缺少的就是无法使用 redux 提供的中间件。我们将上述的计时器组件改写为 useReducer，[在线 Demo](https://codesandbox.io/s/727o0kr4yx)

```javascript
import React, { useReducer } from "react";
const initialState = {
  count: 0
};
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + action.payload };
    case "decrement":
      return { count: state.count - action.payload };
    default:
      throw new Error();
  }
}
function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({ type: "increment", payload: 5 })}>
        +
      </button>
      <button onClick={() => dispatch({ type: "decrement", payload: 5 })}>
        -
      </button>
    </>
  );
}
```

用法跟 Redux 基本上是一致的，用法也很简单，算是提供一个 mini 的 Redux 版本。

## useCallback 记忆函数

在类组件中，我们经常犯下面这样的错误：

```javascript
class App {
    render() {
        return <div>
            <SomeComponent style={{ fontSize: 14 }} doSomething={ () => { console.log('do something'); }}  />
        </div>;
    }
}
```

这样写有什么坏处呢？一旦 App 组件的 props 或者状态改变了就会触发重渲染，即使跟 SomeComponent 组件不相关，由于每次 render 都会产生新的 style 和 doSomething，所以会导致 SomeComponent 重新渲染，倘若 SomeComponent 是一个大型的组件树，这样的 Virtual Dom 的比较显然是很浪费的，解决的办法也很简单，将参数抽离成变量。

```javascript
const fontSizeStyle = { fontSize: 14 };
class App {
    doSomething = () => {
        console.log('do something');
    }
    render() {
        return <div>
            <SomeComponent style={fontSizeStyle} doSomething={ this.doSomething }  />
        </div>;
    }
}
```

在类组件中，我们还可以通过 this 这个对象来存储函数，而在函数组件中没办法进行挂载了。所以函数组件在每次渲染的时候如果有传递函数的话都会重渲染子组件。

```javascript
function App() {
  const handleClick = () => {
    console.log('Click happened');
  }
  return <SomeComponent onClick={handleClick}>Click Me</SomeComponent>;
}
```

而有了 useCallback 就不一样了，你可以通过 useCallback 获得一个记忆后的函数。

```javascript
function App() {
  const memoizedHandleClick = useCallback(() => {
    console.log('Click happened')
  }, []); // 空数组代表无论什么情况下该函数都不会发生改变
  return <SomeComponent onClick={memoizedHandleClick}>Click Me</SomeComponent>;
}
```

老规矩，第二个参数传入一个数组，数组中的每一项一旦值或者引用发生改变，useCallback 就会重新返回一个新的记忆函数提供给后面进行渲染。

这样只要子组件继承了 PureComponent 或者使用 React.memo 就可以有效避免不必要的 VDOM 渲染。

## useMemo 记忆组件

useCallback 的功能完全可以由 useMemo 所取代，如果你想通过使用 useMemo 返回一个记忆函数也是完全可以的。

```
useCallback(fn, inputs) is equivalent to useMemo(() => fn, inputs).
```

所以前面使用 useCallback 的例子可以使用 useMemo 进行改写：

```javascript
function App() {
  const memoizedHandleClick = useCallback(() => () => {
    console.log('Click happened')
  }, []); // 空数组代表无论什么情况下该函数都不会发生改变
  return <SomeComponent onClick={memoizedHandleClick}>Click Me</SomeComponent>;
}
```

唯一的区别是：**useCallback 不会执行第一个参数函数，而是将它返回给你，而 useMemo 会执行第一个函数并且将函数执行结果返回给你。**所以在前面的例子中，可以返回 handleClick 来达到存储函数的目的。

所以 useCallback 常用记忆事件函数，生成记忆后的事件函数并传递给子组件使用。而 useMemo 更适合经过函数计算得到一个确定的值，比如记忆组件。

```javascript
function Parent({ a, b }) {
  // Only re-rendered if `a` changes:
  const child1 = useMemo(() => <Child1 a={a} />, [a]);
  // Only re-rendered if `b` changes:
  const child2 = useMemo(() => <Child2 b={b} />, [b]);
  return (
    <>
      {child1}
      {child2}
    </>
  )
}
```

当 a/b 改变时，child1/child2 才会重新渲染。从例子可以看出来，只有在第二个参数数组的值发生变化时，才会触发子组件的更新。

## useRef 保存引用值

useRef 跟 createRef 类似，都可以用来生成对 DOM 对象的引用，看个简单的例子：[在线 Demo](https://codesandbox.io/s/v6948pww5y?from-embed)

```javascript
import React, { useState, useRef } from "react";
function App() {
  let [name, setName] = useState("Nate");
  let nameRef = useRef();
  const submitButton = () => {
    setName(nameRef.current.value);
  };
  return (
    <div className="App">
      <p>{name}</p>

      <div>
        <input ref={nameRef} type="text" />
        <button type="button" onClick={submitButton}>
          Submit
        </button>
      </div>
    </div>
  );
}
```

useRef 返回的值传递给组件或者 DOM 的 ref 属性，就可以通过 ref.current 值访问组件或真实的 DOM 节点，从而可以对 DOM 进行一些操作，比如监听事件等等。

当然 useRef 远比你想象中的功能更加强大，useRef 的功能有点像类属性，或者说您想要在组件中记录一些值，并且这些值在稍后可以更改。

利用 useRef 就可以绕过 Capture Value 的特性。可以认为 ref 在所有 Render 过程中保持着唯一引用，因此所有对 ref 的赋值或取值，拿到的都只有一个最终状态，而不会在每个 Render 间存在隔离。参考例子：[精读《Function VS Class 组件》](https://juejin.im/post/5c8eec1bf265da67cb619e79)

React Hooks 中存在 Capture Value 的特性：[在线 Demo](https://codesandbox.io/s/93m5mz9w24)

```javascript
function MessageThread() {
  const [message, setMessage] = useState("");

  const showMessage = () => {
    alert("You said: " + message);
  };

  const handleSendClick = () => {
    setTimeout(showMessage, 3000);
  };

  const handleMessageChange = e => {
    setMessage(e.target.value);
  };

  return (
    <>
      <input value={message} onChange={handleMessageChange} />
      <button onClick={handleSendClick}>Send</button>
    </>
  );
}
```

在点击 Send 按钮后，再次修改输入框的值，3 秒后的输出依然是点击前输入框的值。这就是所谓的 capture value 的特性。而在类组件中 3 秒后输出的就是修改后的值，因为这时候 message 是挂载在 this 变量上，它保留的是一个引用值，对 this 属性的访问都会获取到最新的值。讲到这里你应该就明白了，useRef 创建一个引用，就可以有效规避 React Hooks 中 Capture Value 特性。
 
```javascript
function MessageThread() {
  const latestMessage = useRef("");

  const showMessage = () => {
    alert("You said: " + latestMessage.current);
  };

  const handleSendClick = () => {
    setTimeout(showMessage, 3000);
  };

  const handleMessageChange = e => {
    latestMessage.current = e.target.value;
  };
}
```

只要将赋值与取值的对象变成 useRef，而不是 useState，就可以躲过 capture value 特性，在 3 秒后得到最新的值。

## useImperativeHandle 透传 Ref

通过 useImperativeHandle 用于让父组件获取子组件内的索引 [在线 Demo](https://codesandbox.io/s/m7wxjz5j3j)

```javascript
import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
function ChildInputComponent(props, ref) {
  const inputRef = useRef(null);
  useImperativeHandle(ref, () => inputRef.current);
  return <input type="text" name="child input" ref={inputRef} />;
}
const ChildInput = forwardRef(ChildInputComponent);
function App() {
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current.focus();
  }, []);
  return (
    <div>
      <ChildInput ref={inputRef} />
    </div>
  );
}
```

通过这种方式，App 组件可以获得子组件的 input 的 DOM 节点。


## useLayoutEffect 同步执行副作用

大部分情况下，使用 useEffect 就可以帮我们处理组件的副作用，但是如果想要同步调用一些副作用，比如对 DOM 的操作，就需要使用 useLayoutEffect，useLayoutEffect 中的副作用会在 DOM 更新之后同步执行。[在线 Demo](https://codesandbox.io/s/74myo7w94q)

```javascript
function App() {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const title = document.querySelector("#title");
    const titleWidth = title.getBoundingClientRect().width;
    console.log("useLayoutEffect");
    if (width !== titleWidth) {
      setWidth(titleWidth);
    }
  });
  useEffect(() => {
    console.log("useEffect");
  });
  return (
    <div>
      <h1 id="title">hello</h1>
      <h2>{width}</h2>
    </div>
  );
}
```

在上面的例子中，useLayoutEffect 会在 render，DOM 更新之后同步触发函数，会优于 useEffect 异步触发函数。

## React Hooks 不足

尽管我们通过上面的例子看到 React Hooks 的强大之处，似乎类组件完全都可以使用 React Hooks 重写。但是当下 v16.8 的版本中，还无法实现 getSnapshotBeforeUpdate 和 componentDidCatch 这两个在类组件中的生命周期函数。官方也计划在不久的将来在 React Hooks 进行实现。