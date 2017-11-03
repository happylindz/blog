import React from 'react'
import { render } from 'react-dom'
import store from './store'
import NewsList from './views/newsList'
import { Provider } from 'react-redux'



render(
    <Provider store={ store }> 
        <NewsList />
    </Provider>,
    document.getElementById('root')
)