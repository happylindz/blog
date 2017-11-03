[原文地址](https://github.com/happylindz/blog/issues/2)

# Redux 异步流最佳实践

阅读本文之前，希望你对 Redux 有个清晰的认知，如果不熟悉的话可以看这篇文章：[揭秘 React 状态管理](https://github.com/happylindz/react-state-management-tutorial)

如果觉得本文有帮助，可以点 star 鼓励下，本文所有代码都可以从 github 仓库下载，读者可以按照下述打开:

```
git clone https://github.com/happylindz/blog.git
cd blog/code/asynchronousAction/
cd xxx/
yarn
yarn start
```

我们知道，在 Redux 的世界中，Redux action 返回一个 JS 对象，被 Reducer 接收处理后返回新的 State，这一切看似十分美好。整个过程可以看作是：

> view -> actionCreator -> action -> reducer -> newState ->(map) container component

但是真是业务开发我们需要处理异步请求，比如：请求后台数据，延迟执行某个效果，setTimout, setInterval 等等，所以当 Redux 遇到异步操作的时候，又该如何处理呢？

首先我们围绕一个简单的例子展开，然后通过各种方式将它实现出来，基本效果如下：

![](../images/asynchronousAction/1.gif)

## 不使用中间件处理异步

这里我使用的是 CNode 官网的 API，获取首页的文章标题，并将他们全部展示出来，并且右边有个 X 按钮，点击 X 按钮可以将该标题删除。异步请求我们使用封装好的 axios 库，你可以这样发起异步请求：

```javascript
const response = await axios.get('/api/v1/topics')
```

然后在你的 ```package.json``` 文件中加上代理字段

```
{
  "proxy": "https://cnodejs.org",
  //...
}
```

这样当你访问 ```localhost:3000/api/v1/topics``` Node 后台会自动帮你转发请求到 CNode，然后将获取到的结果返回给你，这个过程对你来说是透明的，这样能有效避免跨域的问题。

```
cd asynchronous_without_redux_middleware/
yarn 
yarn start
```

老规矩，我们先来看看项目结构：

```
├── actionCreator
│   └── index.js
├── actionTypes
│   └── index.js
├── constants
│   └── index.js
├── index.js
├── reducers
│   └── index.js
├── store
│   └── index.js
└── views
    ├── newsItem.css
    ├── newsItem.js
    └── newsList.js
```

我们在异步请求时候一共有三种 actionTypes，分别为 FETCH_START, FETCH_SUCCESS, FETCH_FAILURE，这样对应着视图就有四种状态 (constants)：INITIAL_STATE, LOADING_STATE, SUCCESS_STATE, FAILURE_STATE。

actionCreator 对 actionTypes 多一层封装，返回的都还是同步 action，主要的逻辑由视图组件来完成。

```javascript
// views/newsList.js
const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        fetchNewsTitle: async() => {
            dispatch(actionCreator.fetchStart())
            try {
                const response = await axios.get('/api/v1/topics')
                if(response.status === 200) {
                    dispatch(actionCreator.fetchSuccess(response.data))
                }else {
                    throw new Error('fetch failure')
                }
            } catch(e) {
                dispatch(actionCreator.fetchFailure())
            }
        }
    }
}
```

我们可以看出，在发起异步请求之前，我们先发起 FETCH_START action，然后开始发起异步请求，当请求成功之后发起 FETCH_SUCCESS action 并传递数据，当请求失败时发起 FETCH_FAILURE action。

在上面的例子，我们没有破坏同步 action 这个特性，而是将异步请求封装在了具体的业务代码中，这种直观的写法存在着一些问题：

1. 每当我们发起异步请求后，我们总是需要写这样重复的代码，手动地处理获取的数据，其实我们更希望异步返回后能够自我消化处理后面的步骤，对于业务层来说，我只需要给出一个信号，比如：FETCH_START action，后续内容就不要再关心了，应用能帮我处理。
2. 当我们在不同的组件里有同样的异步代码，我们最好将它进行抽象，提取到一个公共的地方进行维护。
3. 没有做竞态处理：点击按钮可以获取 CNode 标题并呈现，因为异步请求返回的时间具有不确定性，多次点击就可能出现后点击的请求先返回先渲染，而前面点击的请求后返回覆盖了最新的请求结果。

通过分析，我们得出需要提取这些逻辑到一个公共的部分，然后简单调用，后续操作自动完成，就像：

```javascript
const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        fetchNewsTitle:() => {
			  xxx.fetchStart() 
        }
    }
}
```

一种思路是将这些异步调用独立抽出到一个公共通用异步操作的文件夹，每个需要调用异步操作的组件就到这个目录下获取需要的函数，但是这样就存在一个问题，因为需要发起 action 请求，那么就需要 dispatch 字段，这就意味着每次调用时候必须显式地传入 dispatch 变量，即:

```javascript
const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        fetchNewsTitle:() => {
			  xxx.fetchStart(dispatch) 
        }
    }
}
```

这样写不够优雅，不过也不失为一种解决方案，可以进行尝试，这里就不展开了。

## 异步 Action

此前介绍的都是同步的 action 请求，接下来介绍一下异步的 action，我们希望在异步请求的时候，action 能够这样处理：

> view -> asyncAction -> wait -> action -> reducer -> newState -> container component

这里 action 不再是同步的，而是具有异步功能，当然因为依赖于异步 IO，也会产生副作用。这里就会存在一个问题，我们需要发起两次 action 请求，这好像我们又得将 dispatch 对象传入函数中，显得不够优雅。同步和异步的调用方式截然不同：

* 同步情况：store.dispatch(actionCreator())
* 异步情况: asyncAction(store.dispatch)

好在我们有 Redux 中间件机制能够帮助我们处理异步 action，让 action 不再仅仅处理同步的请求。

## Redux-thunk：简洁直接

Redux 本身只能处理同步的 action，但可以通过中间件来拦截处理其它类型的 action，比如函数(thunk)，再用回调触发普通 action，从而实现异步处理，在这点上所有 Redux 的异步方案都是类似的。

首先我们通过 redux-thunk 来改写我们之前的例子

```
cd asynchronous_with_redux_thunk/
yarn 
yarn start
```

首先需要在 store 里注入中间件 redux-thunk。

```javascript
import { createStore, applyMiddleware } from 'redux'
import reducer from '../reducers'
import thunk from 'redux-thunk'

// ...

export default createStore(reducer, initValue, applyMiddleware(thunk))
```

这样 redux-thunk 中间件就能够在 action 传递给 reducer 前进行处理。

我们改写我们 actionCreator 对象，再需要那么多同步的 action，只需一个方法即可搞定。

```javascript
// actionCreator/index.js
import * as actionTypes from '../actionTypes'
import axios from 'axios'

export default {
    fetchNewsTitle: () => {
        return async (dispatch, getState) => {
            dispatch({
                type: actionTypes.FETCH_START,
            })
            try {
                const response = await axios.get('https://cnodejs.org/api/v1/topics')
                if(response.status === 200) {
                    dispatch({
                        type: actionTypes.FETCH_SUCCESS,
                        news: response.data.data.map(news => news.title),
                    })
                }else {
                    throw new Error('fetch failure')
                }
            } catch(e) {
                dispatch({
                    type: actionTypes.FETCH_FAILURE
                })
            }
        }
    },
    // ...
}
```

这次 fecthNewsTitle 不再简单返回一个 JS 对象，而是返回一个函数，在函数内可以获得当前 state 以及 dispatch，然后之前的异步操作全部封装在这里。是 redux-thunk 中间让 dispatch 不仅能够处理 JS 对象，也能够处理一个函数。

之后我们在业务代码只需调用：

```javascript
// views/App.js
const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        fetchNewsTitle: () => {
            dispatch(actionCreator.fetchNewsTitle())
        }
    }
}
```

自此当以后 redux 需要处理异步操作的时候，只需将 actionCreator 设为函数，然后在函数里编写你的异步逻辑。

redux-thunk 是一个通用的解决方案，其核心思想是让 action 可以变为一个 thunk ，这样的话:

* 同步情况： dispatch(action)
* 异步情况： dispatch(thunk)

redux-thunk 看似做了很多工作，实现起来却是相当简单：

```javascript
function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;
```

乍一看有有很多层箭头函数链式调用，这其实跟中间件的机制有关，我们只需要关心，当 action 传递到中间件的时候，它会判断该 action 是不是一个函数，如果函数，则拦截当前的 action，因为在当前的闭包中存在 dispatch 和 getState 变量，将两个变量传递到函数中并执行，这就是我们在 actionCreator 返回函数时候能够用到 dispatch 和 getState 的关键原因。redux-thunk 看到传递的 action 是个函数的时候就将其拦截并且执行，这时候这个 action 的返回值已经不再关心，因为它根本没有被继续传递下去，不是函数的话它就放过这个 action，让下个中间件去处理它(next(action))

所以我们前面的例子可以理解为：

```
view -> 函数 action -> redux-thunk 拦截 -> 执行函数并丢弃函数 action -> 一系列 action 操作 -> reducer -> newState -> container component
```

不难理解我们将原本放在公共目录下的异步操作封装在了一个 action，通过中间件的机制让 action 内部能够拿到 dispatch 值，从而在 action 中能够产生更多的同步 action 对象。

redux-thunk 思想很棒，但是其实代码是有一定的相似，比如其实整个代码都是针对请求、成功、失败三部分来处理的，这让我们自然联想到 Promise，同样也是分为 pending、fulfilled、rejected 三种状态。

## Redux-promise：不推荐







