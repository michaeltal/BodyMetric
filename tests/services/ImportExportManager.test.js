const ImportExportManager = require('../../js/features/ImportExportManager');

describe('ImportExportManager', () => {
  let importExportManager;
  let dataManager;
  let notificationService;

  beforeEach(() => {
    // Mock DataManager
    dataManager = {
      addMeasurement: jest.fn(),
      getMeasurements: jest.fn(() => [])
    };

    // Mock NotificationService
    notificationService = {
      showSuccess: jest.fn(),
      showError: jest.fn()
    };

    importExportManager = new ImportExportManager(dataManager, notificationService);

    // Mock DOM elements and APIs
    global.document = {
      createElement: jest.fn(() => ({
        href: '',
        download: '',
        click: jest.fn()
      }))
    };

    global.URL = {
      createObjectURL: jest.fn(() => 'mock-url'),
      revokeObjectURL: jest.fn()
    };

    global.Blob = jest.fn();
    global.FileReader = jest.fn(() => ({
      readAsText: jest.fn(function(file) {
        // Simulate async file reading
        setTimeout(() => {
          this.onload({ target: { result: file.content } });
        }, 0);
      })
    }));
  });

  describe('exportData', () => {
    it('should export measurements to CSV successfully', () => {
      const measurements = [
        { date: '2025-01-01', weight: 70.5, bodyFat: 15.5, leanMass: 59.5 },
        { date: '2025-01-02', weight: 70.2, bodyFat: 15.3, leanMass: 59.4 }
      ];

      importExportManager.exportData(measurements);

      expect(global.Blob).toHaveBeenCalledWith(
        ['Date,Weight (kg),Body Fat %,Lean Mass (kg)\n2025-01-01,70.50,15.5,59.50\n2025-01-02,70.20,15.3,59.40'],
        { type: 'text/csv' }
      );
      expect(notificationService.showSuccess).toHaveBeenCalledWith('Data exported successfully!');
    });

    it('should handle empty measurements array', () => {
      importExportManager.exportData([]);

      expect(notificationService.showError).toHaveBeenCalledWith('No measurements to export');
      expect(global.Blob).not.toHaveBeenCalled();
    });

    it('should handle null measurements', () => {
      importExportManager.exportData(null);

      expect(notificationService.showError).toHaveBeenCalledWith('No measurements to export');
      expect(global.Blob).not.toHaveBeenCalled();
    });

    it('should create download link with correct filename', () => {
      const measurements = [
        { date: '2025-01-01', weight: 70.5, bodyFat: 15.5, leanMass: 59.5 }
      ];

      const mockAnchor = { href: '', download: '', click: jest.fn() };
      global.document.createElement.mockReturnValue(mockAnchor);

      importExportManager.exportData(measurements);

      expect(mockAnchor.download).toMatch(/body-composition-data-\d{4}-\d{2}-\d{2}\.csv/);
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe('validateAndParseCSV', () => {
    it('should parse valid CSV data correctly', () => {
      const csvData = 'Date,Weight (kg),Body Fat %,Lean Mass (kg)\n2025-01-01,70.5,15.5,59.5\n2025-01-02,70.2,15.3,59.4';
      
      const result = importExportManager.validateAndParseCSV(csvData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: expect.any(String),
        date: '2025-01-01',
        weight: 70.5,
        bodyFat: 15.5,
        leanMass: 59.5,
        weightLbs: 70.5 * 2.20462,
        leanMassLbs: 59.5 * 2.20462,
        rowNumber: 2
      });
    });

    it('should skip empty lines', () => {
      const csvData = 'Date,Weight (kg),Body Fat %,Lean Mass (kg)\n2025-01-01,70.5,15.5,59.5\n\n2025-01-02,70.2,15.3,59.4\n';
      
      const result = importExportManager.validateAndParseCSV(csvData);

      expect(result).toHaveLength(2);
    });

    it('should skip invalid rows', () => {
      const csvData = 'Date,Weight (kg),Body Fat %,Lean Mass (kg)\n2025-01-01,70.5,15.5,59.5\ninvalid,data,here\n2025-01-02,70.2,15.3,59.4';
      
      const result = importExportManager.validateAndParseCSV(csvData);

      expect(result).toHaveLength(2);
    });

    it('should handle CSV with only header', () => {
      const csvData = 'Date,Weight (kg),Body Fat %,Lean Mass (kg)';
      
      const result = importExportManager.validateAndParseCSV(csvData);

      expect(result).toHaveLength(0);
    });
  });

  describe('isValidMeasurementData', () => {
    it('should validate correct measurement data', () => {
      const result = importExportManager.isValidMeasurementData('2025-01-01', '70.5', '15.5', '59.5');
      expect(result).toBe(true);
    });

    it('should reject missing date', () => {
      const result = importExportManager.isValidMeasurementData('', '70.5', '15.5', '59.5');
      expect(result).toBe(false);
    });

    it('should reject missing weight', () => {
      const result = importExportManager.isValidMeasurementData('2025-01-01', '', '15.5', '59.5');
      expect(result).toBe(false);
    });

    it('should reject missing body fat', () => {
      const result = importExportManager.isValidMeasurementData('2025-01-01', '70.5', '', '59.5');
      expect(result).toBe(false);
    });

    it('should reject missing lean mass', () => {
      const result = importExportManager.isValidMeasurementData('2025-01-01', '70.5', '15.5', '');
      expect(result).toBe(false);
    });

    it('should reject invalid weight values', () => {
      expect(importExportManager.isValidMeasurementData('2025-01-01', 'invalid', '15.5', '59.5')).toBe(false);
      expect(importExportManager.isValidMeasurementData('2025-01-01', '0', '15.5', '59.5')).toBe(false);
      expect(importExportManager.isValidMeasurementData('2025-01-01', '600', '15.5', '59.5')).toBe(false);
    });

    it('should reject invalid body fat values', () => {
      expect(importExportManager.isValidMeasurementData('2025-01-01', '70.5', 'invalid', '59.5')).toBe(false);
      expect(importExportManager.isValidMeasurementData('2025-01-01', '70.5', '-1', '59.5')).toBe(false);
      expect(importExportManager.isValidMeasurementData('2025-01-01', '70.5', '60', '59.5')).toBe(false);
    });

    it('should reject invalid lean mass values', () => {
      expect(importExportManager.isValidMeasurementData('2025-01-01', '70.5', '15.5', 'invalid')).toBe(false);
      expect(importExportManager.isValidMeasurementData('2025-01-01', '70.5', '15.5', '0')).toBe(false);
      expect(importExportManager.isValidMeasurementData('2025-01-01', '70.5', '15.5', '500')).toBe(false);
    });

    it('should reject invalid date format', () => {
      expect(importExportManager.isValidMeasurementData('01-01-2025', '70.5', '15.5', '59.5')).toBe(false);
      expect(importExportManager.isValidMeasurementData('2025/01/01', '70.5', '15.5', '59.5')).toBe(false);
      expect(importExportManager.isValidMeasurementData('invalid-date', '70.5', '15.5', '59.5')).toBe(false);
    });

    it('should accept valid date format', () => {
      expect(importExportManager.isValidMeasurementData('2025-01-01', '70.5', '15.5', '59.5')).toBe(true);
      expect(importExportManager.isValidMeasurementData('2025-12-31', '70.5', '15.5', '59.5')).toBe(true);
    });
  });

  describe('processMeasurements', () => {
    it('should process valid measurements successfully', async () => {
      const measurements = [
        { id: '1', date: '2025-01-01', weight: 70.5, bodyFat: 15.5, leanMass: 59.5, rowNumber: 2 },
        { id: '2', date: '2025-01-02', weight: 70.2, bodyFat: 15.3, leanMass: 59.4, rowNumber: 3 }
      ];

      dataManager.addMeasurement.mockResolvedValue(true);

      const result = await importExportManager.processMeasurements(measurements);

      expect(result.successCount).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.totalCount).toBe(2);
      expect(dataManager.addMeasurement).toHaveBeenCalledTimes(2);
    });

    it('should handle measurement addition errors', async () => {
      const measurements = [
        { id: '1', date: '2025-01-01', weight: 70.5, bodyFat: 15.5, leanMass: 59.5, rowNumber: 2 },
        { id: '2', date: '2025-01-02', weight: 70.2, bodyFat: 15.3, leanMass: 59.4, rowNumber: 3 }
      ];

      dataManager.addMeasurement
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Duplicate date'));

      const result = await importExportManager.processMeasurements(measurements);

      expect(result.successCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Row 3: Duplicate date');
      expect(result.totalCount).toBe(2);
    });

    it('should handle all measurements failing', async () => {
      const measurements = [
        { id: '1', date: '2025-01-01', weight: 70.5, bodyFat: 15.5, leanMass: 59.5, rowNumber: 2 }
      ];

      dataManager.addMeasurement.mockRejectedValue(new Error('Database error'));

      const result = await importExportManager.processMeasurements(measurements);

      expect(result.successCount).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Row 2: Database error');
    });
  });

  describe('handleImportResult', () => {
    it('should show success message for complete success', () => {
      const result = { successCount: 2, errors: [], totalCount: 2 };
      
      importExportManager.handleImportResult(result);

      expect(notificationService.showSuccess).toHaveBeenCalledWith('Imported 2 measurements successfully!');
    });

    it('should show error message for partial success', () => {
      const result = { successCount: 1, errors: ['Row 3: Duplicate date'], totalCount: 2 };
      
      importExportManager.handleImportResult(result);

      expect(notificationService.showError).toHaveBeenCalledWith('Imported 1 measurements, 1 failed: Row 3: Duplicate date');
    });

    it('should show error message for complete failure', () => {
      const result = { successCount: 0, errors: ['Row 2: Invalid data', 'Row 3: Duplicate date'], totalCount: 2 };
      
      importExportManager.handleImportResult(result);

      expect(notificationService.showError).toHaveBeenCalledWith('Import failed: Row 2: Invalid data, Row 3: Duplicate date');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = importExportManager.generateId();
      const id2 = importExportManager.generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });
  });

  describe('getImportStats', () => {
    it('should calculate stats for valid measurements', () => {
      const measurements = [
        { date: '2025-01-01', weight: 70.0, bodyFat: 15.0, leanMass: 59.5 },
        { date: '2025-01-02', weight: 70.2, bodyFat: 15.2, leanMass: 59.3 },
        { date: '2025-01-03', weight: 70.1, bodyFat: 15.1, leanMass: 59.4 }
      ];

      const stats = importExportManager.getImportStats(measurements);

      expect(stats.totalMeasurements).toBe(3);
      expect(stats.dateRange.start).toBe('2025-01-01');
      expect(stats.dateRange.end).toBe('2025-01-03');
      expect(stats.averageWeight).toBeCloseTo(70.1, 1);
      expect(stats.averageBodyFat).toBeCloseTo(15.1, 1);
      expect(stats.averageLeanMass).toBeCloseTo(59.4, 1);
    });

    it('should handle empty measurements array', () => {
      const stats = importExportManager.getImportStats([]);

      expect(stats.totalMeasurements).toBe(0);
      expect(stats.dateRange).toBe(null);
      expect(stats.averageWeight).toBe(0);
      expect(stats.averageBodyFat).toBe(0);
      expect(stats.averageLeanMass).toBe(0);
    });

    it('should handle null measurements', () => {
      const stats = importExportManager.getImportStats(null);

      expect(stats.totalMeasurements).toBe(0);
      expect(stats.dateRange).toBe(null);
      expect(stats.averageWeight).toBe(0);
      expect(stats.averageBodyFat).toBe(0);
      expect(stats.averageLeanMass).toBe(0);
    });
  });

  describe('exportDataWithOptions', () => {
    it('should export with default options', () => {
      const measurements = [
        { date: '2025-01-01', weight: 70.5, bodyFat: 15.5, leanMass: 59.5, weightLbs: 155.4, leanMassLbs: 131.2 }
      ];

      importExportManager.exportDataWithOptions(measurements);

      expect(global.Blob).toHaveBeenCalledWith(
        ['Date,Weight (kg),Body Fat %,Lean Mass (kg)\n2025-01-01,70.50,15.5,59.50'],
        { type: 'text/csv' }
      );
    });

    it('should export with imperial units included', () => {
      const measurements = [
        { date: '2025-01-01', weight: 70.5, bodyFat: 15.5, leanMass: 59.5, weightLbs: 155.4, leanMassLbs: 131.2 }
      ];

      importExportManager.exportDataWithOptions(measurements, { includeImperialUnits: true });

      expect(global.Blob).toHaveBeenCalledWith(
        ['Date,Weight (kg),Body Fat %,Lean Mass (kg),Weight (lbs),Lean Mass (lbs)\n2025-01-01,70.50,15.5,59.50,155.40,131.20'],
        { type: 'text/csv' }
      );
    });

    it('should use custom filename', () => {
      const measurements = [
        { date: '2025-01-01', weight: 70.5, bodyFat: 15.5, leanMass: 59.5, weightLbs: 155.4, leanMassLbs: 131.2 }
      ];

      const mockAnchor = { href: '', download: '', click: jest.fn() };
      global.document.createElement.mockReturnValue(mockAnchor);

      importExportManager.exportDataWithOptions(measurements, { filename: 'custom-export.csv' });

      expect(mockAnchor.download).toBe('custom-export.csv');
    });
  });

  describe('setCallbacks', () => {
    it('should set import success callback', () => {
      const callback = jest.fn();
      importExportManager.setCallbacks({ onImportSuccess: callback });

      expect(importExportManager.onImportSuccess).toBe(callback);
    });
  });

  describe('importData', () => {
    it('should handle file input change event', async () => {
      const mockFile = { content: 'Date,Weight (kg),Body Fat %,Lean Mass (kg)\n2025-01-01,70.5,15.5,59.5' };
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.csv'
        }
      };

      dataManager.addMeasurement.mockResolvedValue(true);

      await importExportManager.importData(mockEvent);

      expect(mockEvent.target.value).toBe('');
    });

    it('should handle no file selected', async () => {
      const mockEvent = {
        target: {
          files: []
        }
      };

      await importExportManager.importData(mockEvent);

      expect(dataManager.addMeasurement).not.toHaveBeenCalled();
    });
  });
});