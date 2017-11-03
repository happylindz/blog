import * as actionTypes from '../actionTypes'
let nextId = 0
let prev = 0

export const updateData = (ms) => {
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
        setTimeout(() => {
            checkLast({
                type: actionTypes.UPDATE_DATA,
                payload: ms,                    
            })
        }, ms)
    }
}

export const cancelUpdateData = () => {
    nextId ++
    return {
        type: actionTypes.CANCEL_UPDATE_DATA
    }
}