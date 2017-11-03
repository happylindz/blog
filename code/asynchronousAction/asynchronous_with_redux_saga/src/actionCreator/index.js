import * as actionTypes from '../actionTypes'
export default {
    fetchNewsTitle: () => {
        return {
            type: actionTypes.FETCH_START
        }
    },
    deleteNewsTitle: (titleIndex) => {
        return {
            type: actionTypes.DELETE_NEWS_TITLE,
            id: titleIndex
        }
    }
}