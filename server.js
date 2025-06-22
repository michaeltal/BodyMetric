const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');

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

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing data file', e);
  }
}

app.get('/data', (req, res) => {
  res.json(loadData());
});

app.post('/data', (req, res) => {
  const data = req.body || {};
  saveData(data);
  res.json({ status: 'ok' });
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
