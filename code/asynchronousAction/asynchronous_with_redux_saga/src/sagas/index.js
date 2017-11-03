import { put, takeEvery } from 'redux-saga/effects'
import * as actionTypes from '../actionTypes'
import axios from 'axios'

function* fetchNewsTitle() {
    try {
        const response = yield axios.get('/api/v1/topics')
        if(response.status === 200) {
            yield put({
                type: actionTypes.FETCH_SUCCESS,
                news: response.data,
            })
        }else {
            throw new Error('fetch failure')
        }
    } catch(e) {
        yield put({
            type: actionTypes.FETCH_FAILURE
        })
    }
}


export default function* fecthData() {
    yield takeEvery(actionTypes.FETCH_START, fetchNewsTitle)
}