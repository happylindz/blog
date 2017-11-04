import React from 'react'
import './newsItem.css'
import actionCreator from '../actionCreator'
import { connect } from 'react-redux'

const NewsItem = ({ title, deleteNewsTitle }) => {
    console.log(title)
    return <div className='news-item'>
        <p>{ title }</p>
        <button onClick={ deleteNewsTitle }>X</button>
    </div>
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        deleteNewsTitle: () => {
            dispatch(actionCreator.deleteNewsTitle(ownProps.titleIndex))
        }
    }
}

export default connect(null, mapDispatchToProps)(NewsItem)



