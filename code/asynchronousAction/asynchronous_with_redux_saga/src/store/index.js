import { createStore, applyMiddleware } from 'redux'
import reducer from '../reducers'
import createSagaMiddleware from 'redux-saga'
import mySaga from '../sagas'
import { INITIAL_STATE } from '../constants'


const initValue = {
    newsTitleList: [],
    status: INITIAL_STATE,
}
const sagaMiddleware = createSagaMiddleware()

export default createStore(reducer, initValue, applyMiddleware(sagaMiddleware))
sagaMiddleware.run(mySaga)
