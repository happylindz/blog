import { createStore } from 'redux'
import reducer from '../reducers'
import { INITIAL_STATE } from '../constants'


const initValue = {
    newsTitleList: [],
    status: INITIAL_STATE,
}


export default createStore(reducer, initValue)