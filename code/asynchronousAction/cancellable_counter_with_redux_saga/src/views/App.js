import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../actionCreator'

const App = ({incrementAsync, cancelIncrement, countdown, counter}) => (
    <div>
        <button 
            onClick={ countdown ? cancelIncrement: incrementAsync }
            style={{ color: countdown ? 'red': 'black' }}
        >
            { countdown ? `Cancel increment (${countdown})` : 'increment in 5s' }
        </button>
        { '  ' }
        { counter }
    </div>
)

const mapStateToProps = (state) => {
    return {
        ...state
    }
}

const mapDispatchToProps = {
    incrementAsync: actions.incrementAsync.bind(null, 5),
    cancelIncrement: actions.cancelIncrement,
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
