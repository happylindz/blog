import { createStore, applyMiddleware } from 'redux'
import reducer from '../reducers'
import reduxThunk from 'redux-thunk'

export default createStore(reducer, applyMiddleware(reduxThunk))