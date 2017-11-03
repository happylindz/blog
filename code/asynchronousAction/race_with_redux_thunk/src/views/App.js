import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'

const App = ({ data, fetchData, cancelUpdateData }) => {
    return (<div>
        <button onClick={ () => fetchData(5000) } >Fetch data in 5000ms</button>
        <button onClick={ () => fetchData(1000) } >Fetch Data in 1000ms</button>
        <button onClick={ cancelUpdateData } >Cancel to update</button><br /> 
        waiting time: { data != null ? data: 'you cancel to update data' }
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
        },
        cancelUpdateData: () => {
            dispatch(actions.cancelUpdateData())
        }
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(App)
