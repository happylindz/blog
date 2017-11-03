import * as actionTypes from '../actionTypes'

export default {
    fetchStart: () => {
        return {
            type: actionTypes.FETCH_START,
        }
    },
    fetchSuccess: (payload) => {
        return {
            type: actionTypes.FETCH_SUCCESS,
            news: payload,
        }
    },
    fetchFailure: () => {
        return {
            type: actionTypes.FETCH_FAILURE,
        }
    },
    deleteNewsTitle: (titleIndex) => {
        return {
            type: actionTypes.DELETE_NEWS_TITLE,
            id: titleIndex
        }
    }
}