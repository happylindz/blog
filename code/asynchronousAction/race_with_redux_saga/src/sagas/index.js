import { put, call, take, fork, cancel, throttle } from 'redux-saga/effects'
import * as actionTypes from '../actionTypes'

let isFirst = true
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function* asyncAction() {
    let promise = null
    if(isFirst) {
        isFirst = false
        promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(5000)
            }, 5000)
        })
    }else {
        promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(1000)
            }, 1000)
        })
    }
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
        task = yield fork(asyncAction)
        yield call(delay, 1000)
    }
}