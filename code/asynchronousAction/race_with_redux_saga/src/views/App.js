import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'

const App = ({ data, fetchData }) => {
    return (<div>
        <button onClick={ fetchData } >Fetch Data</button>
        { data }
    </div>)
}

const mapStateToProps = (state) => {
    return {
        data: state.data
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        fetchData: () => {
            dispatch(actions.updateData())
        }
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(App)
