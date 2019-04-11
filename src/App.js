import React, { Component } from 'react';
import AutoComplete from './components/AutoComplete';
import { initData, findWay, findLessChangeWay } from './mapHelper';
import stationsData from './stations.json';
import './App.css';
import config from './config';

const logEnable = config.logEnable;

class App extends Component {

  constructor(props) {
    super(props);
    this.state = Object.assign({
      startStation: 'Jurong East',
      endStation: 'Chinatown',
      displayPath: [],
      searchEnable: false,
      selectedOption: '0',
    }, initData(stationsData));
  }

  componentDidMount() {
    this.detectSearchEnable(this.state.startStation, this.state.endStation);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {

  }

  render() {
    return (
      <div className="wrap">
        <h2 className="welcome">
          Thanks you using SG MRT
        </h2>
        <div className="input-wrap">
          <span className="label">Start Station:</span>
          <AutoComplete
            value={ this.state.startStation }
            onChange={
              (value) => {
                this.onStartPositionChange(value);
              } }
            source={ this.state.stationNames }
            showAutoComplete={ true }/>
          <span className="separator"></span>
          <span className="label">End Station:</span>
          <AutoComplete
            value={ this.state.endStation }
            onChange={ (value) => {
              this.onEndPositionChange(value);
            } }
            source={ this.state.stationNames }
            showAutoComplete={ true }/>
        </div>
        <div className="search-wrap">
          <button className="search" onClick={ () => {
            this.doSearch();
          } } disabled={ !this.state.searchEnable }>Search</button>
          <div className="radio-wrap">
            <label>
              <input type="radio"
                     value="0"
                     checked={ this.state.selectedOption === '0' }
                     onChange={ (changeEvent) => {
                       this.setState({
                         selectedOption: changeEvent.target.value,
                       });
                     } }/>
              Least station
            </label>
            <label>
              <input type="radio"
                     value="1"
                     checked={ this.state.selectedOption === '1' }
                     onChange={ (changeEvent) => {
                       this.setState({
                         selectedOption: changeEvent.target.value,
                       });
                     } }/>
              Least line change
            </label>
          </div>
        </div>
        { this.state.displayPath.length > 0 &&
        <ul className="result-wrap">
          {
            this.state.displayPath.map((pathDisplay, inx) => (
              <li key={ `r_${inx}` } className="result-item">{ pathDisplay }</li>
            ))
          }
        </ul> }
      </div>
    );
  }

  onStartPositionChange(value) {
    this.setState({
      startStation: value,
    });
    this.detectSearchEnable(value, this.state.endStation);
  }

  onEndPositionChange(value) {
    this.setState({
      endStation: value,
    });
    this.detectSearchEnable(this.state.startStation, value);
  }

  detectSearchEnable(startStation, endStation) {
    if (this.state.stationNames.indexOf(startStation) >= 0 && this.state.stationNames.indexOf(endStation) >= 0) {
      this.setState({
        searchEnable: true,
      });
    } else {
      this.setState({
        searchEnable: false,
      });
    }
  }

  doSearch() {
    if (!this.state.searchEnable) {
      return;
    }
    if (this.state.selectedOption === '1') {
      const targetPathAndWeight = findLessChangeWay(
        stationsData,
        this.state.stationVertexes,
        this.state.graph,
        this.state.startStation,
        this.state.endStation);
      this.displayPathToUser(targetPathAndWeight);
    } else {
      const targetPathAndWeight = findWay(
        stationsData,
        this.state.stationVertexes,
        this.state.graph,
        this.state.startStation,
        this.state.endStation);
      this.displayPathToUser(targetPathAndWeight);
    }
  }

  //Take <line> from <station> to <station>
  //Change to <line>
  displayPathToUser(targetPathAndWeight) {
    const path = targetPathAndWeight.path;
    const displayPath = [];
    if (!path || path.length === 0) {
      displayPath.push('Sorry, can\'t find the way to this station, please contact admin to get more support');
      this.setState({
        displayPath,
      });
      return;
    }
    let currentLineName = path[0].lineName;
    let currentStationName = path[0].stationName;
    let currentKeepStationName = '';
    for (let i = 1; i < path.length; i++) {
      const stationInfo = path[i];
      if (stationInfo.lineName === currentLineName) {
        //not need to change line;
        if (i === path.length - 1) {
          // is final station;
          displayPath.push(`Take ${ currentLineName } from ${ currentStationName } to ${ stationInfo.stationName }`);
        } else {
          currentKeepStationName = stationInfo.stationName;
        }
      } else {
        displayPath.push(`Take ${ currentLineName } from ${ currentStationName } to ${ currentKeepStationName }`);
        displayPath.push(`Change to ${ stationInfo.lineName }`);
        currentStationName = stationInfo.stationName;
        currentLineName = stationInfo.lineName;
        if (i === path.length - 1) {
          displayPath.push(
            `Take ${ currentLineName } from ${ currentKeepStationName } to ${ stationInfo.stationName }`);
        }
      }
    }
    displayPath.push(
      `Total ${targetPathAndWeight.weight} station you will pass, and need to change line ${targetPathAndWeight.stationChangeTimes} times`);
    this.log(displayPath);
    this.setState({
      displayPath,
    });
  }

  log(data) {
    if (logEnable) {
      console.log(data);
    }
  }
}

export default App;
