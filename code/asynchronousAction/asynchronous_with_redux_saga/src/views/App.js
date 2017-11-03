import React from 'react'
import NewsList from './newsList'
import { connect } from 'react-redux'
import actionCreator from '../actionCreator'


const App = ({ fetchNewsTitle }) => {
    return (<div>
        <button onClick={ fetchNewsTitle } >Fetch Data</button>
        <NewsList />
    </div>)
} 

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        fetchNewsTitle: () => {
            dispatch(actionCreator.fetchNewsTitle())
        }
    }
}


export default connect(null, mapDispatchToProps)(App)