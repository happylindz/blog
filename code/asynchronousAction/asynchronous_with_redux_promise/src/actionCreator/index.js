import * as actionTypes from '../actionTypes'
import axios from 'axios'

export default {
    anotherFetchNewsTitle: (dispatch) => {
         new Promise((resolve, reject) => {
            return axios.get('/api/v1/topics')
                        .then(response => {
                            if(response.status === 200) {
                                dispatch({
                                    type: actionTypes.FETCH_SUCCESS,
                                    news: response.data,
                                })
                            }else {
                                reject()
                            }
                        }).catch(err => {
                            dispatch({
                                type: actionTypes.FETCH_FAILURE,
                            })
                        })
        })
        return {
            type: actionTypes.FETCH_START,            
        }    
    },
    fetchNewsTitle: () => {
        return axios.get('/api/v1/topics').then(response => ({
            type: actionTypes.FETCH_SUCCESS,
            news: response.data,
        })).catch(err => ({
            type: actionTypes.FETCH_FAILURE,
        }))
    },
    myFetchNewsTitle: () => {
        return {
            async: axios.get('/api/v1/topics').then(response => ({
                news: response.data,
            })),
            types: [ actionTypes.FETCH_START, actionTypes.FETCH_SUCCESS, actionTypes.FETCH_FAILURE ]
        }
    },
    deleteNewsTitle: (titleIndex) => {
        return {
            type: actionTypes.DELETE_NEWS_TITLE,
            id: titleIndex
        }
    },
}