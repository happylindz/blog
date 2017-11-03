import * as viewStatus from '../constants'
import * as actionTypes from '../actionTypes'

export default (state, action) => {
    switch(action.type) {
        case actionTypes.FETCH_START:
            return { ...state, 'status': viewStatus.LOADING_STATE }
        case actionTypes.FETCH_SUCCESS:
            return { ...state, 'status': viewStatus.SUCCESS_STATE, newsTitleList: action.news }
        case actionTypes.FETCH_FAILURE:
            return { ...state, 'status': viewStatus.FAILURE_STATE }
        case actionTypes.DELETE_NEWS_TITLE:
            return { ...state, 'newsTitleList': state.newsTitleList.map((item, index) => {
                return index === action.id ? null: item
            }) }
        default:
            return { ...state }
    }
}