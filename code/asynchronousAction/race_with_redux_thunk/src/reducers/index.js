import * as actionTypes from '../actionTypes'

export default (state = {}, action) => {
    console.log(action)
    switch(action.type) {
        case actionTypes.UPDATE_DATA:
            return { ...state, 'data': action.payload }
        case actionTypes.CANCEL_UPDATE_DATA:
            return { ...state, 'data': null }
        default:
            return { ...state }
    }
}