import { 
    INCREMENT_ASYNC, 
    INCREMENT, 
    COUNTDOWN,
    COUNTDOWN_TERMIMATED,
    COUNTDOWN_CANCEL,
} from '../actionTypes'
import { take, put, cancelled, call, race, cancel, fork } from 'redux-saga/effects'
import { delay } from 'redux-saga'

const action = type => ({ type })

function* incrementAsync() {
    while(true) {
        yield call(delay, 1000)
        yield put(action(INCREMENT))
    }
}

function* countdown({ ms }) {
    let task = yield fork(incrementAsync)
    try {
        while(true) {  
            yield put({
                type: COUNTDOWN,
                value: ms--,
            }) 
            yield call(delay, 1000)
            if(ms <= 0) {
                break;
            }
        }
    } finally {
        if(!(yield cancelled())) {
            yield put(action(COUNTDOWN_CANCEL))
        }
        yield cancel(task)
    }
}


export default function* watchIncrementAsync() {
    while(true) {
        const action = yield take(INCREMENT_ASYNC)
        yield race([
            call(countdown, action),
            take(COUNTDOWN_TERMIMATED)
        ])
    }
}