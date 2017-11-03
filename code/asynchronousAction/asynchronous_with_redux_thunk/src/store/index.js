import { createStore, applyMiddleware } from 'redux'
import reducer from '../reducers'
import thunk from 'redux-thunk'
import { INITIAL_STATE } from '../constants'


const initValue = {
    newsTitleList: [],
    status: INITIAL_STATE,
}


export default createStore(reducer, initValue, applyMiddleware(thunk))