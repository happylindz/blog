import { createStore, applyMiddleware } from 'redux'
import reducer from '../reducers'
import reduxPromise from 'redux-promise'
import { INITIAL_STATE } from '../constants'
import myPromiseMiddlewre from '../myPromiseMiddleware'


const initValue = {
    newsTitleList: [],
    status: INITIAL_STATE,
}


export default createStore(reducer, initValue, applyMiddleware(reduxPromise, myPromiseMiddlewre))