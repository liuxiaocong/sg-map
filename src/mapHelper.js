import _ from 'lodash';
import config from './config';

const logEnable = config.logEnable;
const MAX = config.max;

function log(data) {
  if (logEnable) {
    console.log(data);
  }
}

// init the map data, with lines and vertexes (the station with has more the one line pass)
export function initData(stationsData) {
  const circleLineNames = []; // store circle line name ,eg: BP
  const stationNames = []; // line: [], // store station line
  const lines = {};
  const lineChangeMap = {};
  const stationVertexes = [];

  for (let station in stationsData) {
    stationNames.push(station);
    const stationInfo = stationsData[station];
    const passLines = [];
    for (let lineName in stationInfo) {
      // init line change map keys
      if (!lineChangeMap[lineName]) {
        lineChangeMap[lineName] = {};
      }
      passLines.push(lineName);

      // put station info into lines data
      if (!lines[lineName]) {
        lines[lineName] = [];
      }
      const value = stationInfo[lineName];
      if (Array.isArray(value)) {
        // is circle line
        if (circleLineNames.indexOf(lineName) < 0) {
          circleLineNames.push(lineName);
        }
        for (let i = 0; i < value.length; i++) {
          lines[lineName].push({
            name: station,
            value: value[i],
          });
        }
      } else {
        lines[lineName].push({
          name: station,
          value,
        });
      }
    }
    // put station change map
    if (passLines.length > 1) {
      stationVertexes.push({
        name: station,
        isLineVertex: false,
        connectedLines: passLines,
      });
      for (let i = 0; i < passLines.length; i++) {
        const lineName = passLines[i];
        const connectedLines = passLines.slice();
        connectedLines.splice(connectedLines.indexOf(lineName), 1);
        for (let i = 0; i < connectedLines.length; i++) {
          let connectedLine = connectedLines[i];
          if (!lineChangeMap[lineName][connectedLine]) {
            lineChangeMap[lineName][connectedLine] = [];
          }
          lineChangeMap[lineName][connectedLine].push(station);
        }
      }
    }
  }

  for (let lineName in lines) {
    lines[lineName].sort(function(a, b) {
      return a.value - b.value;
    });
    const length = lines[lineName].length;
    if (!_.find(stationVertexes, (station) => {
        return station.name === lines[lineName][0].name;
      })) {
      stationVertexes.push({
        name: lines[lineName][0].name,
        isLineVertex: true,
        connectedLines: getConnectedStation(stationsData[lines[lineName][0].name]),
      });
    }
    if (!_.find(stationVertexes, (station) => {
        return station.name === lines[lineName][length - 1].name;
      })) {
      stationVertexes.push({
        name: lines[lineName][length - 1].name,
        isLineVertex: true,
        connectedLines: getConnectedStation(stationsData[lines[lineName][length - 1].name]),
      });
    }
  }

  const graph = initGraph(stationsData, stationVertexes);

  const data = {
    stationNames,
    graph,
    circleLineNames,
    lineChangeMap,
    lines,
    stationVertexes,
  };
  log('init map data >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  log('lines : store all line with station in order');
  log('stationNames: all the station names, user for name map and auto complete');
  log('circleLineNames: all circle line name');
  log('lineChangeMap: all station enable line A change to line B');
  log('graph: base graph, only store station with different line pass');
  log('stationVertexes: base vertexes, station can direct go to which line');
  log(data);
  return data;
}

export function getConnectedStation(station) {
  const ret = [];
  for (let line in station) {
    ret.push(line);
  }
  return ret;
}

export function initGraph(stationsData, vertex) {
  // graph is a key object, store all the station with vertex and line with weight.
  // start station, end station, station with multiple line pass all consider as vertex;
  const graph = {
    vertexes: {},
    totalCount: 0,
  };
  for (let i = 0; i < vertex.length; i++) {
    const connectLines = [];
    const stationName = vertex[i].name;
    const connectedLines = vertex[i].connectedLines;

    for (let i = 0; i < connectedLines.length; i++) {
      const lineName = connectedLines[i];
      const supportedStations = _.filter(vertex, (station) => {
        return station.connectedLines.indexOf(lineName) >= 0 && station.name !== stationName;
      });

      // add line to the closest vertex, coz current postion maybe an array
      let currentPositionUnCheck = stationsData[stationName][lineName];

      let minLeft = MAX;
      let minRight = MAX;
      if (supportedStations.length === 0) {
        // is circle line
        continue;
      }
      let minLeftName = supportedStations[0].name;
      let minRightName = supportedStations[0].name;
      for (let i = 0; i < supportedStations.length; i++) {
        const connectedStationsName = supportedStations[i].name;
        let stationPosition = stationsData[connectedStationsName][lineName];
        // handle circle line logic, find the most close position, take as weight
        let currentPosition = findMostCloseStation(currentPositionUnCheck, stationPosition).currentPosition;
        stationPosition = findMostCloseStation(currentPosition, stationPosition).targetPosition;

        if (stationPosition > currentPosition) {
          let distance = stationPosition - currentPosition;
          if (distance < minRight) {
            minRight = distance;
            minRightName = connectedStationsName;
          }
        } else {
          let distance = currentPosition - stationPosition;
          if (distance < minLeft) {
            minLeft = distance;
            minLeftName = connectedStationsName;
          }
        }
      }
      if (minLeft !== MAX) {
        connectLines.push({
          lineName,
          name: minLeftName,
          weight: minLeft,
        });
      }
      if (minRight !== MAX) {
        connectLines.push({
          lineName,
          name: minRightName,
          weight: minRight,
        });
      }
    }
    graph.vertexes[vertex[i].name] = {};
    graph.vertexes[vertex[i].name].lines = connectLines;
    graph.totalCount++;
  }
  console.log(graph);
  return graph;
}

export function findMostCloseStation(currentPosition, targetPosition) {

  const ret = {};
  if (!Array.isArray(currentPosition)) {
    ret.currentPosition = currentPosition;
  }
  if (!Array.isArray(targetPosition)) {
    ret.targetPosition = targetPosition;
  }
  if (Array.isArray(currentPosition)) {
    ret.currentPosition = currentPosition[0];
  }
  if (Array.isArray(targetPosition)) {
    ret.targetPosition = targetPosition[0];
  }

  if (Array.isArray(currentPosition) || Array.isArray(targetPosition)) {
    const currentPositionArray = [].concat(currentPosition);
    const targetPositionArray = [].concat(targetPosition);

    let _currentPosition = currentPositionArray[0];
    let _targetPosition = targetPositionArray[0];
    let min = MAX;
    for (let i = 0; i < currentPositionArray.length; i++) {
      for (let j = 0; j < targetPositionArray.length; j++) {
        const distance = Math.abs(currentPositionArray[i] - targetPositionArray[j]);
        if (distance < min) {
          _currentPosition = currentPositionArray[i];
          _targetPosition = targetPositionArray[j];
          min = distance;
        }
      }
    }

    ret.currentPosition = _currentPosition;
    ret.targetPosition = _targetPosition;
  }

  return ret;
}

export function findWay(stationsData, baseStationVertexes, baseGraph, start, end) {
  log('findWay >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  log('start:' + start);
  log('end:' + end);
  let stationVertexes = baseStationVertexes;
  let graph = baseGraph;
  let vertexes = graph.vertexes;
  if (!vertexes[start] || !vertexes[end]) {
    // if the start or end station not in the stationVertexes, need to rebuild the graph
    if (!vertexes[start]) {
      stationVertexes.push({
        name: start,
        isLineVertex: true,
        connectedLines: getConnectedStation(stationsData[start]),
      });
    }
    if (!vertexes[end]) {
      stationVertexes.push({
        name: end,
        isLineVertex: true,
        connectedLines: getConnectedStation(stationsData[end]),
      });
    }
    graph = initGraph(stationsData, stationVertexes);
    vertexes = graph.vertexes;
  }

  const totalCount = graph.totalCount;
  const map = {};
  for (let vertex in vertexes) {
    if (vertex !== vertexes[start]) {
      map[vertex] = {
        weight: MAX,
        path: [],
      };
    }
  }
  const hasAccessed = [];
  const startLines = vertexes[start].lines;
  for (let i = 0; i < startLines.length; i++) {
    const startLine = startLines[i];
    if (startLine.weight < map[startLine.name].weight) {
      map[startLine.name].weight = startLine.weight;
      map[startLine.name].path = [
        {
          stationName: start,
          lineName: startLine.lineName,
        }].concat({
        stationName: startLine.name,
        lineName: startLine.lineName,
      });
    }
  }
  // access the least distance vertex;
  for (let i = 1; i < totalCount; i++) {
    let min = MAX;
    let targetVertexName = null;
    for (let connectVertexName in map) {
      if (hasAccessed.indexOf(connectVertexName) < 0 && min >= map[connectVertexName].weight) {
        min = map[connectVertexName].weight;
        targetVertexName = connectVertexName;
      }
    }
    if (targetVertexName) {
      hasAccessed.push(targetVertexName);
      const targetVertex = vertexes[targetVertexName];
      const targetVertexLines = targetVertex.lines;
      for (let i = 0; i < targetVertexLines.length; i++) {
        const targetVertexLine = targetVertexLines[i];
        if (targetVertexLine.weight + min < map[targetVertexLine.name].weight) {
          map[targetVertexLine.name].weight = targetVertexLine.weight + min;
          map[targetVertexLine.name].path = map[targetVertexName].path.concat(
            {
              stationName: targetVertexLine.name,
              lineName: targetVertexLine.lineName,
            });
        }
      }
    }
  }
  log('least distance map');
  log(map);
  log('target path');
  log(map[end]);
  map[end].stationChangeTimes = findStationChangeTimes(map[end].path);
  return map[end];
}

export function findLessChangeWay(stationsData, baseStationVertexes, baseGraph, start, end) {
  log('findLessChangeWay >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  log('start:' + start);
  log('end:' + end);
  let stationVertexes = baseStationVertexes;
  let graph = baseGraph;
  let vertexes = graph.vertexes;
  if (!vertexes[start] || !vertexes[end]) {
    // if the start or end station not in the stationVertexes, need to rebuild the graph
    if (!vertexes[start]) {
      stationVertexes.push({
        name: start,
        isLineVertex: true,
        connectedLines: getConnectedStation(stationsData[start]),
      });
    }
    if (!vertexes[end]) {
      stationVertexes.push({
        name: end,
        isLineVertex: true,
        connectedLines: getConnectedStation(stationsData[end]),
      });
    }
    graph = initGraph(stationsData, stationVertexes);
    vertexes = graph.vertexes;
  }

  const totalCount = graph.totalCount;
  const map = {};
  for (let vertex in vertexes) {
    if (vertex !== vertexes[start]) {
      map[vertex] = {
        weight: MAX,
        path: [],
        stationChangeTimes: MAX,
      };
    }
  }
  const hasAccessed = [];
  const startLines = vertexes[start].lines;
  for (let i = 0; i < startLines.length; i++) {
    const startLine = startLines[i];
    const stationChangeTimes = findStationChangeTimes([
      {
        stationName: start,
        lineName: startLine.lineName,
      }].concat({
      stationName: startLine.name,
      lineName: startLine.lineName,
    }));
    if (stationChangeTimes < map[startLine.name].stationChangeTimes) {
      map[startLine.name].weight = startLine.weight;
      map[startLine.name].path = [
        {
          stationName: start,
          lineName: startLine.lineName,
        }].concat({
        stationName: startLine.name,
        lineName: startLine.lineName,
        stationChangeTimes,
      });
      map[startLine.name].stationChangeTimes = stationChangeTimes;
    }
  }
  // access the least distance vertex;
  for (let i = 1; i < totalCount; i++) {
    let min = MAX;
    let minChangeTimes = MAX;
    let targetVertexName = null;
    for (let connectVertexName in map) {
      if (hasAccessed.indexOf(connectVertexName) < 0 && minChangeTimes >= map[connectVertexName].stationChangeTimes) {
        minChangeTimes = map[connectVertexName].stationChangeTimes;
        targetVertexName = connectVertexName;
        min = map[connectVertexName].weight;
      }
    }
    if (targetVertexName) {
      hasAccessed.push(targetVertexName);
      const targetVertex = vertexes[targetVertexName];
      const targetVertexLines = targetVertex.lines;
      for (let i = 0; i < targetVertexLines.length; i++) {
        const targetVertexLine = targetVertexLines[i];
        const stationChangeTimes = findStationChangeTimes(
          map[targetVertexName].path.concat(
            {
              stationName: targetVertexLine.name,
              lineName: targetVertexLine.lineName,
            }),
        );
        if (stationChangeTimes < map[targetVertexLine.name].stationChangeTimes
          || (stationChangeTimes === map[targetVertexLine.name].stationChangeTimes &&
            targetVertexLine.weight + min < map[targetVertexLine.name].weight
          )
        ) {
          map[targetVertexLine.name].stationChangeTimes = targetVertexLine.stationChangeTimes + min;
          map[targetVertexLine.name].path = map[targetVertexName].path.concat(
            {
              stationName: targetVertexLine.name,
              lineName: targetVertexLine.lineName,
            });
          map[targetVertexLine.name].weight = targetVertexLine.weight + min;
          map[targetVertexLine.name].stationChangeTimes = stationChangeTimes;
        }
      }
    }
  }
  log('least change map');
  log(map);
  log('target path');
  log(map[end]);

  // need improve this logic
  const lessStation = findWay(stationsData, baseStationVertexes, baseGraph, start, end);
  if (lessStation.stationChangeTimes === map[end].stationChangeTimes && lessStation.weight < map[end].weight) {
    return lessStation;
  }
  return map[end];
}

export function findStationChangeTimes(path) {
  let currentLineName = path[0].lineName;
  let ret = 0;
  for (let i = 1; i < path.length; i++) {
    const stationInfo = path[i];
    if (stationInfo.lineName !== currentLineName) {
      ret++;
      currentLineName = stationInfo.lineName;
    }
  }
  return ret;
}
