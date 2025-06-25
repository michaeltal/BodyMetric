const fs = require('fs');
const path = require('path');

// Import test fixtures
const validData = require('./fixtures/valid-data.json');
const invalidData = require('./fixtures/invalid-data.json');

const TEST_DATA_FILE = path.join(__dirname, 'persistence-test-data.json');

// Functions to test (copied from server.js for isolated testing)
function loadData(filePath = TEST_DATA_FILE) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading data file', e);
  }
  return { measurements: [], goals: { weight: null, bodyFat: null, leanMass: null }, height: 175 };
}

function saveData(data, filePath = TEST_DATA_FILE) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('Error writing data file', e);
    return false;
  }
}

describe('Data Persistence', () => {
  beforeEach(() => {
    // Clean up test file before each test
    if (fs.existsSync(TEST_DATA_FILE)) {
      fs.unlinkSync(TEST_DATA_FILE);
    }
  });

  afterAll(() => {
    // Clean up test file after all tests
    if (fs.existsSync(TEST_DATA_FILE)) {
      fs.unlinkSync(TEST_DATA_FILE);
    }
  });

  describe('loadData function', () => {
    test('should return default structure when file does not exist', () => {
      const result = loadData();
      
      expect(result).toEqual({
        measurements: [],
        goals: { weight: null, bodyFat: null, leanMass: null },
        height: 175
      });
    });

    test('should load valid data from existing file', () => {
      // Pre-populate test file with valid data
      fs.writeFileSync(TEST_DATA_FILE, JSON.stringify(validData, null, 2));
      
      const result = loadData();
      
      expect(result).toEqual(validData);
    });

    test('should handle corrupted JSON file gracefully', () => {
      // Write invalid JSON
      fs.writeFileSync(TEST_DATA_FILE, 'invalid json content');
      
      const result = loadData();
      
      expect(result).toEqual({
        measurements: [],
        goals: { weight: null, bodyFat: null, leanMass: null },
        height: 175
      });
    });

    test('should handle empty file gracefully', () => {
      // Create empty file
      fs.writeFileSync(TEST_DATA_FILE, '');
      
      const result = loadData();
      
      expect(result).toEqual({
        measurements: [],
        goals: { weight: null, bodyFat: null, leanMass: null },
        height: 175
      });
    });

    test('should handle file with only whitespace', () => {
      // Create file with only whitespace
      fs.writeFileSync(TEST_DATA_FILE, '   \n  \t  ');
      
      const result = loadData();
      
      expect(result).toEqual({
        measurements: [],
        goals: { weight: null, bodyFat: null, leanMass: null },
        height: 175
      });
    });
  });

  describe('saveData function', () => {
    test('should save valid data successfully', () => {
      const result = saveData(validData);
      
      expect(result).toBe(true);
      expect(fs.existsSync(TEST_DATA_FILE)).toBe(true);
      
      // Verify the saved content
      const savedContent = JSON.parse(fs.readFileSync(TEST_DATA_FILE, 'utf-8'));
      expect(savedContent).toEqual(validData);
    });

    test('should save data with proper JSON formatting', () => {
      saveData(validData);
      
      const savedContent = fs.readFileSync(TEST_DATA_FILE, 'utf-8');
      
      // Should be properly formatted JSON with 2-space indentation
      expect(savedContent).toContain('  "measurements": [');
      expect(savedContent).toContain('  "goals": {');
    });

    test('should handle empty object', () => {
      const emptyData = {};
      const result = saveData(emptyData);
      
      expect(result).toBe(true);
      
      const savedContent = JSON.parse(fs.readFileSync(TEST_DATA_FILE, 'utf-8'));
      expect(savedContent).toEqual({});
    });

    test('should handle null data', () => {
      const result = saveData(null);
      
      expect(result).toBe(true);
      
      const savedContent = fs.readFileSync(TEST_DATA_FILE, 'utf-8');
      expect(savedContent).toBe('null');
    });

    test('should handle circular reference gracefully', () => {
      const circularData = { test: 'value' };
      circularData.circular = circularData;
      
      const result = saveData(circularData);
      
      // Should return false due to JSON.stringify error
      expect(result).toBe(false);
      expect(fs.existsSync(TEST_DATA_FILE)).toBe(false);
    });

    test('should handle invalid file path gracefully', () => {
      const invalidPath = '/invalid/path/that/does/not/exist/data.json';
      const result = saveData(validData, invalidPath);
      
      expect(result).toBe(false);
    });
  });

  describe('Data integrity', () => {
    test('should maintain data integrity through save/load cycle', () => {
      // Save data
      const result = saveData(validData);
      expect(result).toBe(true);
      
      // Load data back
      const loadedData = loadData();
      
      // Should be identical
      expect(loadedData).toEqual(validData);
    });

    test('should handle large datasets', () => {
      // Create large dataset
      const largeData = {
        measurements: [],
        goals: { weight: 70, bodyFat: 10, leanMass: 45 },
        height: 175
      };
      
      // Generate 1000 measurements
      for (let i = 0; i < 1000; i++) {
        largeData.measurements.push({
          id: `test${i}`,
          date: `2025-01-${String(i % 28 + 1).padStart(2, '0')}`,
          weight: 70 + (Math.random() - 0.5) * 10,
          bodyFat: 10 + (Math.random() - 0.5) * 5,
          leanMass: 45 + (Math.random() - 0.5) * 8
        });
      }
      
      const saveResult = saveData(largeData);
      expect(saveResult).toBe(true);
      
      const loadedData = loadData();
      expect(loadedData.measurements).toHaveLength(1000);
      expect(loadedData.goals).toEqual(largeData.goals);
    });
  });

  describe('File system edge cases', () => {
    test('should handle concurrent access patterns', async () => {
      const testData1 = { ...validData, height: 180 };
      const testData2 = { ...validData, height: 190 };
      
      // Simulate concurrent saves
      const promises = [
        Promise.resolve(saveData(testData1)),
        Promise.resolve(saveData(testData2))
      ];
      
      const results = await Promise.all(promises);
      
      // Both operations should succeed
      expect(results[0]).toBe(true);
      expect(results[1]).toBe(true);
      
      // Final state should be one of the datasets
      const finalData = loadData();
      expect(finalData.height === 180 || finalData.height === 190).toBe(true);
    });
  });
});