

import {
    COUNTDOWN,
    COUNTDOWN_CANCEL,
    COUNTDOWN_TERMIMATED,
    INCREMENT,
} from '../actionTypes'


export const countdown = (state = 0, action) => {
    switch(action.type) {
        case COUNTDOWN:
            return action.value;
        case COUNTDOWN_CANCEL:
        case COUNTDOWN_TERMIMATED:
            return 0
        default:
            return state
    }
}

export const counter = (state = 0, action) => {
    switch(action.type) {
        case INCREMENT:
            return state + 1
        default:
            return state
    }
}