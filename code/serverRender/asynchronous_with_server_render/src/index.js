import path from 'path'

import Express from 'express'
import React from 'react'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import counterApp from './reducers'
import App from './views/App'

const app = Express()
const port = 3000

app.use(handleRender)

function handleRender(req, res) {
    // 创建新的 Redux store 实例
    const store = createStore(counterApp);
  
    // 把组件渲染成字符串
    const html = renderToString(
      <Provider store={store}>
        <App />
      </Provider>
    )
  
    // 从 store 中获得初始 state
    const preloadedState = store.getState();
  
    // 把渲染后的页面内容发送给客户端
    res.send(renderFullPage(html, preloadedState));
}

function renderFullPage(html, preloadedState) {
return `
    <!doctype html>
    <html>
    <head>
        <title>Redux Universal Example</title>
    </head>
    <body>
        <div id="root">${html}</div>
        <script>
        window.__INITIAL_STATE__ = ${JSON.stringify(preloadedState)}
        </script>
        <script src="/static/bundle.js"></script>
    </body>
    </html>
    `
}
app.listen(port)