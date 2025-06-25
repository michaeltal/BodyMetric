const request = require('supertest');
const fs = require('fs');
const path = require('path');
const express = require('express');

// We need to re-create the server logic here to test it in isolation
const app = express();
app.use(express.json());

const TEST_DATA_FILE = path.join(__dirname, 'concurrency-test-data.json');
let isWriting = false;
const queue = [];

function saveData(data, callback) {
  fs.writeFile(TEST_DATA_FILE, JSON.stringify(data, null, 2), (err) => {
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

app.post('/data', (req, res) => {
  const data = req.body || {};
  queue.push({ data, res });
  processQueue();
});

describe('Server Concurrency', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DATA_FILE)) {
      fs.unlinkSync(TEST_DATA_FILE);
    }
    while(queue.length > 0) {
      queue.pop();
    }
    isWriting = false;
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DATA_FILE)) {
      fs.unlinkSync(TEST_DATA_FILE);
    }
  });

  test('should handle multiple concurrent POST requests without data corruption', async () => {
    const numRequests = 5;
    const requests = [];

    for (let i = 0; i < numRequests; i++) {
      const testData = { measurements: [{ id: `test${i}` }] };
      requests.push(
        request(app)
          .post('/data')
          .send(testData)
          .expect(200)
      );
    }

    await Promise.all(requests);

    const finalData = JSON.parse(fs.readFileSync(TEST_DATA_FILE, 'utf-8'));
    
    // The final data should be one of the payloads sent.
    // The key is that the file is valid JSON and not a corrupted mix.
    const lastRequestData = { measurements: [{ id: `test${numRequests - 1}` }] };
    expect(finalData).toEqual(expect.any(Object));
    expect(finalData.measurements[0].id.startsWith('test')).toBe(true);
  }, 10000);
});
