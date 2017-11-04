import * as actionTypes from '../actionTypes'
import axios from 'axios'

export default {
    fetchNewsTitle: () => {
        return async (dispatch, getState) => {
            dispatch({
                type: actionTypes.FETCH_START,
            })
            try {
                const response = await axios.get('https://cnodejs.org/api/v1/topics')
                if(response.status === 200) {
                    dispatch({
                        type: actionTypes.FETCH_SUCCESS,
                        news: response.data,
                    })
                }else {
                    throw new Error('fetch failure')
                }
            } catch(e) {
                dispatch({
                    type: actionTypes.FETCH_FAILURE
                })
            }
        }
    },
    deleteNewsTitle: (titleIndex) => {
        return {
            type: actionTypes.DELETE_NEWS_TITLE,
            id: titleIndex
        }
    }
}