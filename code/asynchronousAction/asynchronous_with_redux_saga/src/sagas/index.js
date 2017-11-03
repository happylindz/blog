// import { takeEvery }  from 'redux-saga'
import { put, takeEvery } from 'redux-saga/effects'
import * as actionTypes from '../actionTypes'
import axios from 'axios'

function* fetchNewsTitle() {
    try {
        const response = yield axios.get('https://cnodejs.org/api/v1/topics')
        if(response.status === 200) {
            yield put({
                type: actionTypes.FETCH_SUCCESS,
                news: response.data.data.map(news => news.title),
            })
        }else {
            throw Error()
        }
    } catch(e) {
        yield put({
            type: actionTypes.FETCH_FAILURE
        })
    }
}


export default function* watchIncrementAsync() {
    yield takeEvery(actionTypes.FETCH_START, fetchNewsTitle)
}