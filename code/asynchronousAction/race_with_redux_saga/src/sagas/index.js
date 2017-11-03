import { put, call, take, fork, cancel } from 'redux-saga/effects'
import * as actionTypes from '../actionTypes'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function* asyncAction({ ms }) {
    let promise = new Promise((resolve) => {
        setTimeout(() => {
            resolve(ms)
        }, ms)
    })
    let payload = yield promise
    yield put({
        type: actionTypes.UPDATE_DATA,
        payload: payload
    })
}

export default function* () {
    let task 
    while(true) {
        const action = yield take(actionTypes.INITIAL)
        if(task) {
            yield cancel(task)
        }
        task = yield fork(asyncAction, action)
        yield call(delay, 1000)
    }
}