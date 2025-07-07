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
  
  // Initialize with sample data if no file exists
  const sampleData = {
    measurements: [
      { id: "sample1", date: "2025-03-21", weight: 75.1, bodyFat: 18.5, leanMass: 61.2, weightLbs: 165.7, leanMassLbs: 135.0 },
      { id: "sample2", date: "2025-03-28", weight: 74.8, bodyFat: 18.2, leanMass: 61.2, weightLbs: 165.0, leanMassLbs: 135.0 },
      { id: "sample3", date: "2025-04-04", weight: 74.5, bodyFat: 17.9, leanMass: 61.1, weightLbs: 164.2, leanMassLbs: 134.7 },
      { id: "sample4", date: "2025-04-11", weight: 74.2, bodyFat: 17.6, leanMass: 61.1, weightLbs: 163.6, leanMassLbs: 134.7 },
      { id: "sample5", date: "2025-04-18", weight: 74.0, bodyFat: 17.4, leanMass: 61.1, weightLbs: 163.1, leanMassLbs: 134.7 }
    ],
    goals: { weight: null, bodyFat: null, leanMass: null },
    height: 175
  };
  
  // Save the sample data to create the file
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(sampleData, null, 2));
    console.log('Initialized data file with sample data');
  } catch (e) {
    console.error('Error creating initial data file', e);
  }
  
  return sampleData;
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
