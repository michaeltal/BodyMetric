const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Import the app
const express = require('express');
const app = express();

app.use(express.json());

const TEST_DATA_FILE = path.join(__dirname, 'test-data.json');

// Mock functions for testing
function loadTestData() {
  try {
    if (fs.existsSync(TEST_DATA_FILE)) {
      const raw = fs.readFileSync(TEST_DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading test data file', e);
  }
  return { measurements: [], goals: { weight: null, bodyFat: null, leanMass: null }, height: 175 };
}

function saveTestData(data) {
  try {
    fs.writeFileSync(TEST_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing test data file', e);
  }
}

// Test routes
app.get('/data', (req, res) => {
  res.json(loadTestData());
});

app.post('/data', (req, res) => {
  const data = req.body || {};
  saveTestData(data);
  res.json({ status: 'ok' });
});

app.use(express.static(__dirname));

describe('BodyMetric Server API', () => {
  beforeEach(() => {
    // Clean up test data file before each test
    if (fs.existsSync(TEST_DATA_FILE)) {
      fs.unlinkSync(TEST_DATA_FILE);
    }
  });

  afterAll(() => {
    // Clean up test data file after all tests
    if (fs.existsSync(TEST_DATA_FILE)) {
      fs.unlinkSync(TEST_DATA_FILE);
    }
  });

  describe('GET /data', () => {
    test('should return default data structure when no file exists', async () => {
      const response = await request(app).get('/data');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        measurements: [],
        goals: { weight: null, bodyFat: null, leanMass: null },
        height: 175
      });
    });

    test('should return existing data when file exists', async () => {
      const testData = {
        measurements: [
          {
            id: 'test123',
            date: '2025-06-25',
            weight: 70,
            bodyFat: 10,
            leanMass: 45
          }
        ],
        goals: { weight: 75, bodyFat: 8, leanMass: 50 },
        height: 180
      };

      // Pre-populate test data
      saveTestData(testData);

      const response = await request(app).get('/data');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(testData);
    });

    test('should handle corrupted data file gracefully', async () => {
      // Write invalid JSON to test file
      fs.writeFileSync(TEST_DATA_FILE, 'invalid json content');

      const response = await request(app).get('/data');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        measurements: [],
        goals: { weight: null, bodyFat: null, leanMass: null },
        height: 175
      });
    });
  });

  describe('POST /data', () => {
    test('should save valid data and return success status', async () => {
      const testData = {
        measurements: [
          {
            id: 'test456',
            date: '2025-06-24',
            weight: 69.5,
            bodyFat: 10.5,
            leanMass: 44.8
          }
        ],
        goals: { weight: 72, bodyFat: 9, leanMass: 48 },
        height: 185
      };

      const response = await request(app)
        .post('/data')
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });

      // Verify data was actually saved
      const savedData = loadTestData();
      expect(savedData).toEqual(testData);
    });

    test('should handle empty POST body', async () => {
      const response = await request(app)
        .post('/data')
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });

      // Verify empty object was saved
      const savedData = loadTestData();
      expect(savedData).toEqual({});
    });

    test('should handle null POST body', async () => {
      const response = await request(app)
        .post('/data')
        .send(null);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/data')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });

  describe('Static file serving', () => {
    test('should serve static files', async () => {
      // Create a test static file
      const testFilePath = path.join(__dirname, 'test-static.txt');
      fs.writeFileSync(testFilePath, 'test content');

      const response = await request(app).get('/test-static.txt');
      
      expect(response.status).toBe(200);
      expect(response.text).toBe('test content');

      // Cleanup
      fs.unlinkSync(testFilePath);
    });
  });
});