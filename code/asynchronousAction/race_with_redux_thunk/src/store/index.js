import { createStore, applyMiddleware } from 'redux'
import reduxThunk from 'redux-thunk'
import reducer from '../reducers'

const initValue = {
    data: 0
}

export default createStore(reducer, initValue, applyMiddleware(reduxThunk))

