'use strict';

let LOG = true;
let RESOLUTION = 10; //minutes
let OUTDIR = '/Users/latentflip/.project-time-logs';

let Fs = require('fs');
let moment = require('moment');
let Chokidar = require('chokidar');

try {
  Fs.mkdirSync(OUTDIR);
} catch (e) {
}

let watcher = Chokidar.watch('/Users/latentflip/Code/github/', {
  ignored: [
    /node_modules/,
    /[\/\\]\./
  ],
  ignoreInitial: true,
  followSymlinks: false,
  cwd: '/Users/latentflip/Code/github/',
  depth: 8
});

watcher.on('change', (path) => {
  update(path);
});

watcher.on('add', (path) => {
  update(path);
});

let data = [
];

setInterval(flush, 1000 * 60 * RESOLUTION * 1.5);

function update(path) {
  let timestamp = moment();
  let date = getDate(timestamp);
  let time = getTime(timestamp);
  path = normalizePath(path);

  let row = data.find((d) => d.date === date && d.time === time);
  if (!row) {
    row = { date: date, time: time, paths: {} };
    data.push(row);
  }
  row.paths[path] = row.paths[path] || 0;
  row.paths[path]++;

  if (LOG) console.dir(data);
  flush(date, time);
}

function flush(date, time) {
  if (LOG) console.log('Trying to flush');
  if (!date || !time) {
    let timestamp = moment();
    date = getDate(timestamp);
    time = getTime(timestamp);
  }

  let toRemove = [];
  data.forEach((row, index) => {
    if (LOG) console.log('Testing', row.date, row.time, 'vs', date, time, row.date !== date || row.time !== time);
    if (row.date !== date || row.time !== time) {
      if (LOG) console.log('Flushing', row.date, row.time);
      Fs.appendFileSync(`/Users/latentflip/.project-time-logs/${date}.jsonl`, JSON.stringify(row) + '\n');
      toRemove.push(row);
    }
  });

  data = data.filter((row) => toRemove.indexOf(row) === -1);
}

function normalizePath(path) {
  return path.split('/').slice(0,2).join('/');
}

function getTime(momentTime) {
  let hour = momentTime.hour();
  let min = momentTime.minute();
  return `${hour}:${roundDown(min, RESOLUTION)}`;
}

function getDate(momentTime) {
  return momentTime.format('YYYY-MM-DD');
}

function roundDown(val, roundFactor) {
  return Math.floor(val / roundFactor) * roundFactor;
}
