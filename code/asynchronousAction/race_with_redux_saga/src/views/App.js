import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'

const App = ({ data, fetchData }) => {
    return (<div>
        <button onClick={ () => fetchData(5000) } >Fetch data in 5000ms</button>
        <button onClick={ () => fetchData(1000) } >Fetch data in 1000ms</button>
        waiting time: { data }
    </div>)
}

const mapStateToProps = (state) => {
    return {
        data: state.data
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        fetchData: (ms) => {
            dispatch(actions.updateData(ms))
        }
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(App)
