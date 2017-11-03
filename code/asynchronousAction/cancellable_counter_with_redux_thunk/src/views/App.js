import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../actionCreator'

const App = ({incrementAsync, terminateCountDown, countdown, counter}) => (
    <div>
        <button 
            onClick={ countdown ? terminateCountDown: incrementAsync }
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
    terminateCountDown: actions.terminateCountDown,
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
