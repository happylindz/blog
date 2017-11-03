import * as actionTypes from '../actionTypes'
let isFirst = true
let nextId = 0
let prev = 0

export const updateData = () => {
     return (dispatch) => {
        let id = ++nextId
        let now = + new Date()
        if(now - prev < 1000) {
            return;
        }
        prev = now;
        const checkLast = (action) => {
            if(id === nextId) {
                dispatch(action)
            }
        }
        if(isFirst) {
            isFirst = false
            setTimeout(() => {
                checkLast({
                    type: actionTypes.UPDATE_DATA,
                    payload: 5000,                    
                })
            }, 5000)
        }else {
            setTimeout(() => {
                checkLast({
                    type: actionTypes.UPDATE_DATA,
                    payload: 1000,                    
                })
            }, 1000)
        }
    }
}