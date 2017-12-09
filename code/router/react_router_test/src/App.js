import React, { Component } from 'react';
import { BrowserRouter as Router, Link, Route } from 'react-router-dom';
import './index.css';

const HomeView = () => <div>Home</div>;
const AboutView = () => <div>About</div>;
const TopicsView = ({ match }) => (<div>
  <h2>Topics</h2>
  <ul>
    <li><Link to={`${match.url}/topic1`} >Topic1</Link></li>
    <li><Link to={`${match.url}/topic2`} >Topic2</Link></li>
    <li><Link to={`${match.url}/topic3`} >Topic3</Link></li>
  </ul>
  <Route path={ `${match.url}/topic1` } component={ () => <div>Topic1</div> } /> 
  <Route path={ `${match.url}/topic2` } component={ () => <div>Topic2</div> } /> 
  <Route path={ `${match.url}/topic3` } component={ () => <div>Topic3</div> } /> 
</div>)

class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <ul>
            <li>
              <Link to="/">home</Link>
            </li>
            <li>
              <Link to="/about">about</Link>
            </li>
            <li>
              <Link to="/topics">topics</Link>
            </li>
          </ul>
          <Route exact path="/" component={HomeView} />
          <Route path="/about" component={AboutView} />
          <Route path="/topics" component={TopicsView} />
          <Route component={() => <div>Always show</div>} />
        </div>
      </Router>
    );
  }
}

export default App;
