"use strict";

const fs = require('fs');
const moment = require('moment');
const Papa = require('papaparse');
const util = require('util');

function computeHoursIn(timeIn, keyFunction) {
  const timeInPerKey = timeIn.reduce((acc, elem) => {
    const key = keyFunction(elem.entered);
    const timesIn = acc[key] ? acc[key] : [];
    timesIn.push(elem);
    acc[key] = timesIn;
    return acc
  }, {});

  Object.keys(timeInPerKey).map(day => {
    const seconds = timeInPerKey[day].reduce((seconds, {entered, exited}) => {
      return seconds + exited.getTime() - entered.getTime()
    }, 0);
    timeInPerKey[day] = (seconds / (60 * 60 * 1000)).toFixed(2) + " hours"
  });

  return timeInPerKey
}

function computeTimeIn(fileContent) {
  const actions = Papa.parse(fileContent).data.map(line => {
    return {
      date: moment(line[0], "MMMM DD, YYYY at hh:mmA").toDate(),
      action: line[1]
    }
  });

  return actions.reduce((acc, elem) => {
    if (elem.action === 'entered') {
      return {
        lastEntered: elem.date,
        timeIn: acc.timeIn
      }
    } else { // elem.action === 'exited'
      const timeIn = acc.timeIn;
      timeIn.push({
        entered: acc.lastEntered,
        exited: elem.date,
      });
      return {
        lastEntered: null,
        timeIn
      }
    }
  }, {lastEntered: null, timeIn: []}).timeIn;
}

if (process.argv.length !== 3) {
  console.log("Usage: " + __filename + " CSV_FILE");
  process.exit(-1);
}

const csvFileName = process.argv[2];

fs.readFile(csvFileName, "utf-8", (err, fileContent) => {
  if (err) {
    return console.log(err);
  }

  const timeIn = computeTimeIn(fileContent);

  console.log("Per day: " + util.inspect(computeHoursIn(timeIn, date => moment(date).format("MMMM Do"))));
  console.log("Per week: " + util.inspect(computeHoursIn(timeIn, date => "Week " + moment(date).format("ww"))));
});
