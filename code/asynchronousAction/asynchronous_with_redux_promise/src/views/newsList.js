import React, { Component }from 'react'
import { connect } from 'react-redux'
import NewsItem from './newsItem'
import actionCreator from '../actionCreator'
import * as viewStatus from '../constants'

class NewsList extends Component {
    componentDidMount() {
        this.props.fetchNewsTitle()
    }
    render() {
        const { status, newsTitleList } = this.props
        if(status === viewStatus.INITIAL_STATE) {
            return <div>begin to load some news data...</div>
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
}

const mapStateToProps = (state, ownProps) => {
    return {
        ...state
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        fetchNewsTitle: () => {
            dispatch(actionCreator.myFetchNewsTitle())
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(NewsList)