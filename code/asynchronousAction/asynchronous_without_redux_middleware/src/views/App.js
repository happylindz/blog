import React from 'react'
import NewsList from './newsList'
import { connect } from 'react-redux'
import axios from 'axios'
import actionCreator from '../actionCreator'


const App = ({ fetchNewsTitle }) => {
    return (<div>
        <button onClick={ fetchNewsTitle } >Fetch Data</button>
        <NewsList />
    </div>)
} 

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        fetchNewsTitle: async() => {
            dispatch(actionCreator.fetchStart())
            try {
                const response = await axios.get('/api/v1/topics')
                if(response.status === 200) {
                    dispatch(actionCreator.fetchSuccess(response.data))
                }else {
                    throw new Error('fetch failure')
                }
            } catch(e) {
                dispatch(actionCreator.fetchFailure())
            }
        }
    }
}


export default connect(null, mapDispatchToProps)(App)