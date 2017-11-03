import {
    INCREMENT,
    COUNTDOWN,
    COUNTDOWN_CANCEL,
    COUNTDOWN_TERMIMATED
} from '../actionTypes'

let incrementTimer
let countdownTimer

const action = type => ({ type })

export const increment = () => action(INCREMENT)

export const terminateCountDown = () => (dispatch) => {
    clearInterval(incrementTimer)
    clearInterval(countdownTimer)
    dispatch(action(COUNTDOWN_TERMIMATED))
}

export const cancelCountDown = () => (dispatch) => {
    clearInterval(incrementTimer)
    clearInterval(countdownTimer)
    dispatch(action(COUNTDOWN_CANCEL))
}

export const incrementAsync = (time) => (dispatch) => {
    incrementTimer = setInterval(() => {
        dispatch(increment())
    }, 1000)
    dispatch({
        value: time,
        type: COUNTDOWN,
    })
    countdownTimer = setInterval(() => {
        time--
        if(time <= 0) {
            dispatch(cancelCountDown())
        }else {
            dispatch({
                value: time,
                type: COUNTDOWN,
            })
        }
    }, 1000)
}

