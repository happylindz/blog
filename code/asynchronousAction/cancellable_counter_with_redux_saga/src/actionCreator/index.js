import * as actionTypes from '../actionTypes'

export const cancelIncrement = () => ({
    type: actionTypes.COUNTDOWN_TERMIMATED
})

export const incrementAsync = (ms) => ({
    type: actionTypes.INCREMENT_ASYNC,
    ms
})