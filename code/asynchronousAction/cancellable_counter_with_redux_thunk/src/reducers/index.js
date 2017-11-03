import * as reducers from './counter'
import { combineReducers } from 'redux'

export default combineReducers({
    ...reducers
})