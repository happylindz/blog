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

redux-thunk 这种方案对于小型的应用来说足够日常使用，然而对于大型应用来说，你可能会发现一些不方便的地方，对于组合多 action，取消 action，竞态判断的处理就显然有点儿力不从心，这些东西我们也会在后面进行谈到。

redux-thunk 思想很棒，但是其实代码是有一定的相似，比如其实整个代码都是针对请求、成功、失败三部分来处理的，这让我们自然联想到 Promise，同样也是分为 pending、fulfilled、rejected 三种状态。

## Redux-promise：不推荐

Promise 代表一种承诺，本用来解决异步回调地狱问题，首先我们先来看看 redux-promise 中间件的源码：

```javascript
import { isFSA } from 'flux-standard-action';

function isPromise(val) {
  return val && typeof val.then === 'function';
}

export default function promiseMiddleware({ dispatch }) {
  return next => action => {
    if (!isFSA(action)) {
      return isPromise(action)
        ? action.then(dispatch)
        : next(action);
    }

    return isPromise(action.payload)
      ? action.payload.then(
          result => dispatch({ ...action, payload: result }),
          error => {
            dispatch({ ...action, payload: error, error: true });
            return Promise.reject(error);
          }
        )
      : next(action);
  };
}
```

和 redux-thunk 一样，我们抛开复杂的链式箭头函数调用，该中间件做的一件事就是判断 action 或 action.payload 是不是一个 Promise 对象，如果是的话，同样地拦截等待 Promise 对象 resolve 返回数据之后再调用 dispatch，同样的，这个 Promise action 也不会被传递给 reducer 进行处理，如果不是 Promise 对象就不处理。

所以一个异步 action 流程就变成了这样：

```
view -> Promise action -> redux-promise 拦截 -> 等待 promise resolve -> 将 promise resolve 返回的新的 action(普通) 对象 dispatch -> reducer -> newState -> container component
```

通过 redux-promise 中间件我们可以在编写 promise action，我们对之前的例子进行修改：

```
cd asynchronous_with_redux_promise/
yarn 
yarn start
```

我们修改一下 actionCreator：

```javascript
// actionCreator/index.js
export default {
    fetchNewsTitle: () => {
        return axios.get('/api/v1/topics').then(response => ({
            type: actionTypes.FETCH_SUCCESS,
            news: response.data,
        })).catch(err => ({
            type: actionTypes.FETCH_FAILURE,
        }))
    },
}
```

修改 store 中间件 redux-promise

```javascript
// store/index.js

import { createStore, applyMiddleware } from 'redux'
import reducer from '../reducers'
import reduxPromise from 'redux-promise'

export default createStore(reducer, initValue, applyMiddleware(reduxPromise))
```

效果:没有 Loading 这个中间状态

![](../images/asynchronousAction/2.gif)

但是如果使用 redux-promise 的话相当于是延后执行了 action，等获取到结果之后再重新 dispatch action。这么写其实有个问题，就是无法发起 FETCH_START action，因为actionCreator 中没有 dispatch 这个字段，redux-promise 虽然赋予了 action 延后执行的能力，但是没有能力发起多 action 请求。

严格上来说，我们完全可以写一个中间件，通过判断 action 对象上的某个字段或者什么其他字段，代码如下:

```javascript
const thunk = ({ dispatch, getState }) => next => action => {
	if(typeof action.async === 'function) {
	    return action.async(dispatch, getState);
	}
	return next(action);
}
```

如果能够这样理解 action 对象，那么我们也没有要求 Promise 中间件处理的异步 action 对象是 Promise 对象，只需要 action 对象谋改革字段是 Promise 字段就行，而 action 对象可以拥有其他字段来包含更多信息。所以我们可以自己编写一个中间件：

```javascript
// myPromiseMiddleware
const isPromise = (obj) => {
    return obj && typeof obj.then === 'function';
}

export default ({ dispatch }) => (next) => (action) => {
    const { types, async, ...rest } = action
    if(!isPromise(async) || !(action.types && action.types.length === 3)) {
        return next(action)
    }
    const [PENDING, SUCCESS, FAILURE] = types
    dispatch({
        ...rest,
        type: PENDING,
    })
    return action.async.then(
        (result) => dispatch({ ...rest, ...result, type: SUCCESS }),
        (error) => dispatch({ ...rest, ...error, type: FAILURE })
    )
}
```

不难理解，中间件接受同样接收一个 action JS 对象，这个对象需要满足 async 字段是 Promise 对象并且 types 字段长度为 3，否则这不是我们需要的处理的 action 对象，我们传入的 types 字段是个数组，分别为 FETCH_START，FETCH_SUCCESS，FETCH_FAILURE，相当于是我们做个一层约定，让中间件内部去帮我们消化这样的异步 action，当 async promise 对象返回之后调用 FETCH_SUCCESS，FETCH_FAILURE action。

我们改写 actionCreator

```javascript
// actionCreator/index.js
export default {
    myFetchNewsTitle: () => {
        return {
            async: axios.get('/api/v1/topics').then(response => ({
                news: response.data,
            })),
            types: [ actionTypes.FETCH_START, actionTypes.FETCH_SUCCESS, actionTypes.FETCH_FAILURE ]
        }
    },
}
```

这样写相当于是我们约定好了格式，然后让相应地中间件去处理就可以了。但是扩展性较差，适合小型团队共同开发约定好具体的异步格式。

## Redux-saga：功能强大

redux-saga 也是解决 redux 异步 action 的一个中间件，不过它与前面的解决方案思路有所不同，它另辟新径：

1. redux-saga 完全基于 ES6 的生成器。
2. 不污染 action，仍使用同步的 action 策略，而是通过监控 action，自动做处理。
3. 所有带副作用的操作，如异步请求，业务控制逻辑代码都可以放到独立的 saga 中来。

让异步行为成为架构中独立的一层(称为 saga)，既不在 action creator 中，也不和 reducer 沾边。

它的出发点是把副作用 (Side effect，异步行为就是典型的副作用) 看成"线程"，可以通过普通的 action 去触发它，当副作用完成时也会触发 action 作为输出。

详细的文档说明可以看: [Redux-saga Beginner Tutorial](https://redux-saga.js.org/docs/introduction/BeginnerTutorial.html)

接下来我也会举很多例子来说明 redux-saga 的优点。

我们老规矩先来改写我们之前的例子:

```
cd asynchronous_with_redux_saga/
yarn 
yarn start
```

首先先来看 actionCreator：

```javascript
import * as actionTypes from '../actionTypes'
export default {
    fetchNewsTitle: () => {
        return {
            type: actionTypes.FETCH_START
        }
    },
	// ...
}
```

是不是变得很干净，因为处理异步的逻辑已经在 creator 里面了，转移到 saga 中，我们来看一下 saga 是怎么写的。

```javascript
// sagas/index.js

import { put, takeEvery } from 'redux-saga/effects'
import * as actionTypes from '../actionTypes'
import axios from 'axios'

function* fetchNewsTitle() {
    try {
        const response = yield axios.get('/api/v1/topics')
        if(response.status === 200) {
            yield put({
                type: actionTypes.FETCH_SUCCESS,
                news: response.data,
            })
        }else {
            throw new Error('fetch failure')
        }
    } catch(e) {
        yield put({
            type: actionTypes.FETCH_FAILURE
        })
    }
}

export default function* fecthData () {
    yield takeEvery(actionTypes.FETCH_START, fetchNewsTitle)
}
```

可以发现这里写的跟之前写的异步操作基本上是一模一样，上面的代码不理解，takeEvery 监听所有的 action，每当发现 ```action.type === FETCH_START``` 时执行 fetchNewsTitle 这个函数，注意这里只是做监听 action 的动作，并不会拦截 action，这说明 FETCH_START action 仍然会经过 reducer 去处理，剩下 fetchNewsTitle 函数就很好理解，就是执行所谓的异步操作，这里的 put 相当于 dispatch。

最后我们需要在 store 里面使用 saga 中间件

```javascript
// store/index.js
import createSagaMiddleware from 'redux-saga'
import mySaga from '../sagas'

const sagaMiddleware = createSagaMiddleware()

// ...

export default createStore(reducer, initValue, applyMiddleware(sagaMiddleware))
sagaMiddleware.run(mySaga)
```

通过注册 saga 中间件并且 run 监听 saga 任务，也就是前面提到的 fecthData。

基于这么一个简单的例子，我们可以看到 saga 将所有的带副作用的操作与 actionCreator 和 reducer 进行分离，通过监听 action 来做自动处理，相比 async action creator 的方案，它可以保证组件触发的 action 是纯对象。

参考回答：[redux-saga 实践总结](https://zhuanlan.zhihu.com/p/23012870)

它与 redux-thunk 编写异步的方式有着它各自的应用场景，没有优劣之分，所谓存在即合理。redux-saga 相对于这种方式，具有以下的特点：

1. 生命周期有所不同，redux-saga 可以理解成一直运行与后台的长时事务，而 redux-thunk 是一个 action，因为 redux-saga 能做的事更多。
2. redux-saga 有诸多声明式易测的 Effects，比如无阻塞调用，中断任务，这些特性在业务逻辑复杂的场景下非常适用。
3. redux-saga 最具魅力的地方，是它保持了 action 的原义，保持 action 的简洁，把所有带副作用的地方独立开来，这些特性使得其在业务逻辑简单的场景下，也能保持代码清晰简洁。

在我看来：redux-thunk + async/await 的方式学习成本低，比较适合不太复杂的异步交互场景。对于竞态判断，多重 action 组合，取消异步等场景下使用则显得乏力，redux-saga 在异步交互复杂的场景下仍能够让你清晰直观地编写代码，不过学习成本相对较高。

以上我们介绍了三种 redux 异步方案，其实关于 redux 异步方案还有很多，比如：redux-observale，通过 rxjs 的方式来书写异步请求，也有像 redux-loop 这样的方式通过在 reducer 上做文章来达到异步效果。其实方案千千万万，各成一派，每种方案都有其适合的场景，结合自己实际的需求来选择你所使用的 redux 异步方案才最可贵。

## thunk 和 saga 异步方案对比

对于前面获取异步的例子，还没有结束，它仍存在着一些问题：

1. 没有进行防抖处理，如果用户疯狂点击按钮，那么将会不断发起异步请求，这样无形之中就对带宽造成了浪费。
2. 没有做竞态判断，点击按钮可以获取 CNode 标题并呈现，因为异步请求返回的时间具有不确定性，多次点击就可能出现后点击的请求先返回先渲染，而前面点击的请求后返回覆盖了最新的请求结果。
3. 没有做取消处理，是想一下，在某些场景下，在等待的过程中，用户是有可能取消这个异步操作的，这时候就不呈现结果了。

下面我们将重新改写一个例子，分别用 redux-thunk 和 redux-saga 对其进行处理上述的问题，并进行比较。











