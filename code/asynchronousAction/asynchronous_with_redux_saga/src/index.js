import React from 'react'
import { render } from 'react-dom'
import store from './store'
import App from './views/App'
import { Provider } from 'react-redux'



render(
    <Provider store={ store }> 
        <App />
    </Provider>,
    document.getElementById('root')
)