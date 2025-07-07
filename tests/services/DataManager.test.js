const DataManager = require('../../js/services/DataManager');

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('DataManager', () => {
  let dataManager;

  beforeEach(() => {
    dataManager = new DataManager();
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(dataManager.measurements).toEqual([]);
      expect(dataManager.goals).toEqual({ weight: null, bodyFat: null, leanMass: null });
      expect(dataManager.height).toBe(175);
    });
  });

  describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = dataManager.generateId();
      const id2 = dataManager.generateId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
    });
  });

  describe('loadData', () => {
    test('should load data from server successfully', async () => {
      const mockData = {
        measurements: [{ id: 'test1', date: '2025-01-01', weight: 70 }],
        goals: { weight: 65, bodyFat: 12, leanMass: 52 },
        height: 180
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await dataManager.loadData();

      expect(dataManager.measurements).toEqual(mockData.measurements);
      expect(dataManager.goals).toEqual(mockData.goals);
      expect(dataManager.height).toBe(mockData.height);
    });

    test('should throw error when server fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(dataManager.loadData()).rejects.toThrow('Unable to connect to server');
    });

    test('should sort measurements by date descending', async () => {
      const mockData = {
        measurements: [
          { id: 'test1', date: '2025-01-01', weight: 70 },
          { id: 'test2', date: '2025-01-03', weight: 71 },
          { id: 'test3', date: '2025-01-02', weight: 69 }
        ],
        goals: {},
        height: 175
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await dataManager.loadData();

      expect(dataManager.measurements[0].date).toBe('2025-01-03');
      expect(dataManager.measurements[1].date).toBe('2025-01-02');
      expect(dataManager.measurements[2].date).toBe('2025-01-01');
    });
  });

  describe('addMeasurement', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });
    });

    test('should add new measurement', async () => {
      const measurement = { date: '2025-01-01', weight: 70 };
      
      await dataManager.addMeasurement(measurement);
      
      expect(dataManager.measurements).toHaveLength(1);
      expect(dataManager.measurements[0]).toMatchObject(measurement);
      expect(dataManager.measurements[0].id).toBeDefined();
      expect(fetch).toHaveBeenCalledWith('/data', expect.objectContaining({ method: 'POST' }));
    });

    test('should update existing measurement for same date', async () => {
      dataManager.measurements = [{ id: 'test1', date: '2025-01-01', weight: 70 }];
      
      const updatedMeasurement = { date: '2025-01-01', weight: 75, bodyFat: 18 };
      await dataManager.addMeasurement(updatedMeasurement);
      
      expect(dataManager.measurements).toHaveLength(1);
      expect(dataManager.measurements[0].weight).toBe(75);
      expect(dataManager.measurements[0].bodyFat).toBe(18);
    });

    test('should maintain sort order after adding measurement', async () => {
      dataManager.measurements = [
        { id: 'test1', date: '2025-01-03', weight: 70 },
        { id: 'test2', date: '2025-01-01', weight: 69 }
      ];
      
      const newMeasurement = { date: '2025-01-02', weight: 71 };
      await dataManager.addMeasurement(newMeasurement);
      
      expect(dataManager.measurements[0].date).toBe('2025-01-03');
      expect(dataManager.measurements[1].date).toBe('2025-01-02');
      expect(dataManager.measurements[2].date).toBe('2025-01-01');
    });
  });

  describe('updateMeasurement', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });
    });

    test('should update existing measurement successfully', async () => {
      const measurement = { id: 'test1', date: '2025-01-01', weight: 70 };
      dataManager.measurements = [measurement];
      
      const result = await dataManager.updateMeasurement('test1', { weight: 75, bodyFat: 18 });

      expect(result).toBe(true);
      expect(dataManager.measurements[0].weight).toBe(75);
      expect(dataManager.measurements[0].bodyFat).toBe(18);
      expect(dataManager.measurements[0].date).toBe('2025-01-01');
    });

    test('should return false for non-existent measurement', async () => {
      const result = await dataManager.updateMeasurement('nonexistent', { weight: 75 });

      expect(result).toBe(false);
    });
  });

  describe('deleteMeasurement', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });
    });

    test('should delete existing measurement', async () => {
      const measurement = { id: 'test1', date: '2025-01-01', weight: 70 };
      dataManager.measurements = [measurement];
      
      const result = await dataManager.deleteMeasurement('test1');

      expect(result).toBe(true);
      expect(dataManager.measurements).toHaveLength(0);
    });

    test('should return false for non-existent measurement', async () => {
      const result = await dataManager.deleteMeasurement('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('goals management', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });
    });

    test('should set and get goals', async () => {
      const goals = { weight: 65, bodyFat: 12, leanMass: 52 };
      
      await dataManager.setGoals(goals);
      
      expect(dataManager.getGoals()).toEqual(goals);
      expect(fetch).toHaveBeenCalledWith('/data', expect.objectContaining({ method: 'POST' }));
    });

    test('should merge goals when setting partial goals', async () => {
      dataManager.goals = { weight: 65, bodyFat: 12, leanMass: 52 };
      
      await dataManager.setGoals({ weight: 70 });
      
      expect(dataManager.getGoals()).toEqual({ weight: 70, bodyFat: 12, leanMass: 52 });
    });
  });

  describe('height management', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });
    });

    test('should set and get height', async () => {
      await dataManager.setHeight(180);
      
      expect(dataManager.getHeight()).toBe(180);
      expect(fetch).toHaveBeenCalledWith('/data', expect.objectContaining({ method: 'POST' }));
    });
  });

  describe('measurementExistsForDate', () => {
    test('should return true when measurement exists for date', () => {
      dataManager.measurements = [{ id: 'test1', date: '2025-01-01', weight: 70 }];
      
      expect(dataManager.measurementExistsForDate('2025-01-01')).toBe(true);
    });

    test('should return false when no measurement exists for date', () => {
      expect(dataManager.measurementExistsForDate('2025-01-01')).toBe(false);
    });
  });

  describe('getMeasurement', () => {
    test('should return measurement by ID', () => {
      const measurement = { id: 'test1', date: '2025-01-01', weight: 70 };
      dataManager.measurements = [measurement];
      
      expect(dataManager.getMeasurement('test1')).toBe(measurement);
    });

    test('should return undefined for non-existent ID', () => {
      expect(dataManager.getMeasurement('nonexistent')).toBeUndefined();
    });
  });

  describe('getMeasurements', () => {
    test('should return copy of measurements array', () => {
      const measurements = [{ id: 'test1', date: '2025-01-01', weight: 70 }];
      dataManager.measurements = measurements;
      
      const result = dataManager.getMeasurements();
      
      expect(result).toEqual(measurements);
      expect(result).not.toBe(measurements); // Should be a copy
    });
  });

  describe('error handling', () => {
    test('should throw error when server save fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(dataManager.addMeasurement({ date: '2025-01-01', weight: 70 }))
        .rejects.toThrow('Unable to save data to server');
    });

    test('should throw error when server returns non-ok status', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      
      await expect(dataManager.loadData()).rejects.toThrow('Unable to connect to server');
    });
  });
});