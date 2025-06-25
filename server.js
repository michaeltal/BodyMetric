const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');
let isWriting = false;
const queue = [];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading data file', e);
  }
  return { measurements: [], goals: { weight: null, bodyFat: null, leanMass: null }, height: 175 };
}

function saveData(data, callback) {
  fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error('Error writing data file', err);
    }
    callback(err);
  });
}

function processQueue() {
  if (queue.length === 0 || isWriting) {
    return;
  }
  isWriting = true;
  const { data, res } = queue.shift();
  saveData(data, (err) => {
    isWriting = false;
    if (err) {
      res.status(500).json({ status: 'error', message: 'Failed to save data' });
    } else {
      res.json({ status: 'ok' });
    }
    processQueue();
  });
}

app.get('/data', (req, res) => {
  res.json(loadData());
});

app.post('/data', (req, res) => {
  const data = req.body || {};
  queue.push({ data, res });
  processQueue();
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
