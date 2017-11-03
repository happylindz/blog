import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import reducer from '../reducers'
import mySagas from '../sagas'

const initValue = {
    data: 20
}

const sagaMiddleware = createSagaMiddleware()

export default createStore(reducer, initValue, applyMiddleware(sagaMiddleware))

sagaMiddleware.run(mySagas)