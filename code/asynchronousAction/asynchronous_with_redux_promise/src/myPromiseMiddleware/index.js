
const isPromise = (obj) => {
    return obj && typeof obj.then === 'function';
}

export default ({ dispatch }) => (next) => (action) => {
    const { types, async, ...rest } = action
    if(!isPromise(async) || !(action.types && action.types.length === 3)) {
        return next(action)
    }
    const [PENDING, SUCCESS, FAILURE] = types
    dispatch({
        ...rest,
        type: PENDING,
    })
    return action.async.then(
        (result) => dispatch({ ...rest, ...result, type: SUCCESS }),
        (error) => dispatch({ ...rest, ...error, type: FAILURE })
    )
}
