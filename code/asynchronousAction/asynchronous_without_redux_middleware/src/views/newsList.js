import React from 'react'
import { connect } from 'react-redux'
import NewsItem from './newsItem'
import * as viewStatus from '../constants'


const NewsList = ({ status, newsTitleList }) => {
    if(status === viewStatus.INITIAL_STATE) {
        return <div>no news data...</div>
    }else if(status === viewStatus.LOADING_STATE) {
        return <div>loading...</div>
    }else if(status === viewStatus.SUCCESS_STATE) {
        return newsTitleList.map((newsTitle, index)=> {
            return newsTitle !== null &&  <NewsItem key={ newsTitle } title={ newsTitle } titleIndex={index}/>
        })
    }else {
        return <div>something wrong on the page!!!</div>
    }
}


const mapStateToProps = (state, ownProps) => {
    return {
        ...state
    }
}


export default connect(mapStateToProps)(NewsList)