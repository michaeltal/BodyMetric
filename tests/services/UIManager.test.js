const UIManager = require('../../js/ui/UIManager');

describe('UIManager', () => {
  let uiManager;
  let mockCalculationService;
  let mockDataManager;

  beforeEach(() => {
    // Mock DOM elements
    global.document = {
      getElementById: jest.fn(() => ({
        textContent: '',
        innerHTML: ''
      }))
    };

    // Mock CalculationService
    mockCalculationService = {
      formatWeight: jest.fn((weight, useMetric) => useMetric ? `${weight.toFixed(1)}` : `${(weight * 2.205).toFixed(1)}`),
      formatLeanMass: jest.fn((leanMass, useMetric) => useMetric ? `${leanMass.toFixed(1)}` : `${(leanMass * 2.205).toFixed(1)}`),
      calculateTrend: jest.fn((current, previous) => ({
        direction: current > previous ? 'up' : current < previous ? 'down' : 'stable',
        change: Math.abs(current - previous)
      })),
      formatTrend: jest.fn((trendData, unit) => `<span>${trendData.direction} ${trendData.change.toFixed(1)}${unit}</span>`),
      calculateBMI: jest.fn((weight, height) => weight / ((height / 100) ** 2)),
      getBMICategory: jest.fn((bmi) => {
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
      }),
      getAverage: jest.fn((measurements, field, start, end) => {
        const slice = measurements.slice(start, end);
        if (slice.length === 0) return null;
        return slice.reduce((sum, m) => sum + m[field], 0) / slice.length;
      })
    };

    // Mock DataManager
    mockDataManager = {
      getHeight: jest.fn(() => 175) // 175 cm
    };

    uiManager = new UIManager(mockCalculationService, mockDataManager);
  });

  describe('constructor', () => {
    test('should initialize with calculation and data services', () => {
      expect(uiManager.calculationService).toBe(mockCalculationService);
      expect(uiManager.dataManager).toBe(mockDataManager);
    });
  });

  describe('updateCurrentDate', () => {
    test('should update current date display', () => {
      const mockElement = { textContent: '' };
      global.document.getElementById.mockReturnValue(mockElement);

      uiManager.updateCurrentDate();

      expect(global.document.getElementById).toHaveBeenCalledWith('currentDate');
      expect(mockElement.textContent).toMatch(/^\w+, \w+ \d{1,2}, \d{4}$/);
    });
  });

  describe('updateStats', () => {
    test('should show empty stats when no measurements', () => {
      const spy = jest.spyOn(uiManager, 'showEmptyStats');
      const avgSpy = jest.spyOn(uiManager, 'showEmptyAverageStats');

      uiManager.updateStats([], true);

      expect(spy).toHaveBeenCalled();
      expect(avgSpy).toHaveBeenCalled();
    });

    test('should update current values display', () => {
      const measurements = [
        { weight: 75.0, bodyFat: 18.5, leanMass: 61.0 },
        { weight: 75.5, bodyFat: 19.0, leanMass: 60.5 }
      ];

      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '', innerHTML: '' };
        return mockElements[id];
      });

      uiManager.updateStats(measurements, true);

      expect(mockElements.currentWeight.textContent).toBe('75.0');
      expect(mockElements.currentBodyFat.textContent).toBe('18.5');
      expect(mockElements.currentLeanMass.textContent).toBe('61.0');
      expect(mockElements.weightUnit.textContent).toBe('kg');
      expect(mockElements.leanMassUnit.textContent).toBe('kg');
    });

    test('should update trends when previous measurement exists', () => {
      const measurements = [
        { weight: 75.0, bodyFat: 18.5, leanMass: 61.0 },
        { weight: 75.5, bodyFat: 19.0, leanMass: 60.5 }
      ];

      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '', innerHTML: '' };
        return mockElements[id];
      });

      uiManager.updateStats(measurements, true);

      expect(mockCalculationService.calculateTrend).toHaveBeenCalledWith(75.0, 75.5);
      expect(mockCalculationService.calculateTrend).toHaveBeenCalledWith(18.5, 19.0);
      expect(mockCalculationService.calculateTrend).toHaveBeenCalledWith(61.0, 60.5);
    });

    test('should update BMI and call updateSevenDayStats', () => {
      const measurements = [{ weight: 75.0, bodyFat: 18.5, leanMass: 61.0 }];
      const bmiSpy = jest.spyOn(uiManager, 'updateBMI');
      const sevenDaySpy = jest.spyOn(uiManager, 'updateSevenDayStats');

      uiManager.updateStats(measurements, true);

      expect(bmiSpy).toHaveBeenCalledWith(75.0);
      expect(sevenDaySpy).toHaveBeenCalledWith(measurements, true);
    });
  });

  describe('showEmptyStats', () => {
    test('should display empty values for current stats', () => {
      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '', innerHTML: '' };
        return mockElements[id];
      });

      uiManager.showEmptyStats();

      expect(mockElements.currentWeight.textContent).toBe('--.-');
      expect(mockElements.currentBodyFat.textContent).toBe('--.-%');
      expect(mockElements.currentLeanMass.textContent).toBe('--.-');
      expect(mockElements.currentBMI.textContent).toBe('--.-');
      expect(mockElements.bmiCategory.textContent).toBe('--');
    });

    test('should clear trend elements', () => {
      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '', innerHTML: '' };
        return mockElements[id];
      });

      uiManager.showEmptyStats();

      expect(mockElements.weightTrend.innerHTML).toBe('');
      expect(mockElements.bodyFatTrend.innerHTML).toBe('');
      expect(mockElements.leanMassTrend.innerHTML).toBe('');
    });
  });

  describe('showEmptyAverageStats', () => {
    test('should display empty values for average stats', () => {
      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '', innerHTML: '' };
        return mockElements[id];
      });

      uiManager.showEmptyAverageStats();

      expect(mockElements.avgWeight.textContent).toBe('--.-');
      expect(mockElements.avgBodyFat.textContent).toBe('--.-%');
      expect(mockElements.avgLeanMass.textContent).toBe('--.-');
      expect(mockElements.avgBMI.textContent).toBe('--.-');
      expect(mockElements.avgBMICategory.textContent).toBe('--');
    });

    test('should clear average trend elements', () => {
      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '', innerHTML: '' };
        return mockElements[id];
      });

      uiManager.showEmptyAverageStats();

      expect(mockElements.avgWeightTrend.innerHTML).toBe('');
      expect(mockElements.avgBodyFatTrend.innerHTML).toBe('');
      expect(mockElements.avgLeanMassTrend.innerHTML).toBe('');
    });
  });

  describe('updateTrend', () => {
    test('should update trend element with formatted trend data', () => {
      const mockElement = { innerHTML: '' };
      global.document.getElementById.mockReturnValue(mockElement);

      uiManager.updateTrend('weightTrend', 75.0, 75.5, 'kg');

      expect(mockCalculationService.calculateTrend).toHaveBeenCalledWith(75.0, 75.5);
      expect(mockCalculationService.formatTrend).toHaveBeenCalledWith(expect.any(Object), 'kg');
      expect(mockElement.innerHTML).toBe('<span>down 0.5kg</span>');
    });
  });

  describe('updateBMI', () => {
    test('should update BMI display with calculation', () => {
      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '' };
        return mockElements[id];
      });

      uiManager.updateBMI(75.0);

      expect(mockCalculationService.calculateBMI).toHaveBeenCalledWith(75.0, 175);
      expect(mockCalculationService.getBMICategory).toHaveBeenCalled();
      expect(mockElements.currentBMI.textContent).toMatch(/^\d+\.\d$/);
      expect(mockElements.bmiCategory.textContent).toBe('Normal');
    });

    test('should not update BMI when no height available', () => {
      mockDataManager.getHeight.mockReturnValue(null);

      uiManager.updateBMI(75.0);

      expect(mockCalculationService.calculateBMI).not.toHaveBeenCalled();
    });
  });

  describe('updateAverageBMI', () => {
    test('should update average BMI display', () => {
      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '' };
        return mockElements[id];
      });

      uiManager.updateAverageBMI(74.0);

      expect(mockCalculationService.calculateBMI).toHaveBeenCalledWith(74.0, 175);
      expect(mockCalculationService.getBMICategory).toHaveBeenCalled();
      expect(mockElements.avgBMI.textContent).toMatch(/^\d+\.\d$/);
      expect(mockElements.avgBMICategory.textContent).toBe('Normal');
    });
  });

  describe('updateSevenDayStats', () => {
    const measurements = [
      { weight: 75.0, bodyFat: 18.5, leanMass: 61.0 },
      { weight: 75.1, bodyFat: 18.6, leanMass: 61.1 },
      { weight: 75.2, bodyFat: 18.7, leanMass: 61.2 },
      { weight: 75.3, bodyFat: 18.8, leanMass: 61.3 },
      { weight: 75.4, bodyFat: 18.9, leanMass: 61.4 },
      { weight: 75.5, bodyFat: 19.0, leanMass: 61.5 },
      { weight: 75.6, bodyFat: 19.1, leanMass: 61.6 },
      { weight: 76.0, bodyFat: 19.5, leanMass: 62.0 }
    ];

    test('should display empty stats when no average available', () => {
      mockCalculationService.getAverage.mockReturnValue(null);
      const spy = jest.spyOn(uiManager, 'showEmptyAverageStats');

      uiManager.updateSevenDayStats(measurements, true);

      expect(spy).toHaveBeenCalled();
    });

    test('should update 7-day average displays', () => {
      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '', innerHTML: '' };
        return mockElements[id];
      });

      // Mock averages
      mockCalculationService.getAverage.mockImplementation((measurements, field, start, end) => {
        if (start === 0 && end === 7) {
          return { weight: 75.3, bodyFat: 18.8, leanMass: 61.3 }[field];
        }
        if (start === 7 && end === 14) {
          return { weight: 75.8, bodyFat: 19.3, leanMass: 61.8 }[field];
        }
        return null;
      });

      uiManager.updateSevenDayStats(measurements, true);

      expect(mockElements.avgWeight.textContent).toBe('75.3');
      expect(mockElements.avgBodyFat.textContent).toBe('18.8');
      expect(mockElements.avgLeanMass.textContent).toBe('61.3');
      expect(mockElements.avgWeightUnit.textContent).toBe('kg');
      expect(mockElements.avgLeanMassUnit.textContent).toBe('kg');
    });

    test('should update trends with baseline comparison', () => {
      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '', innerHTML: '' };
        return mockElements[id];
      });

      // Mock averages with baseline
      mockCalculationService.getAverage.mockImplementation((measurements, field, start, end) => {
        if (start === 0 && end === 7) {
          return { weight: 75.3, bodyFat: 18.8, leanMass: 61.3 }[field];
        }
        if (start === 7 && end === 14) {
          return { weight: 75.8, bodyFat: 19.3, leanMass: 61.8 }[field];
        }
        return null;
      });

      const trendSpy = jest.spyOn(uiManager, 'updateTrend');

      uiManager.updateSevenDayStats(measurements, true);

      expect(trendSpy).toHaveBeenCalledWith('avgWeightTrend', 75.3, 75.8, 'kg');
      expect(trendSpy).toHaveBeenCalledWith('avgBodyFatTrend', 18.8, 19.3, '%');
      expect(trendSpy).toHaveBeenCalledWith('avgLeanMassTrend', 61.3, 61.8, 'kg');
    });

    test('should use single measurement as baseline when no average available', () => {
      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '', innerHTML: '' };
        return mockElements[id];
      });

      // Mock averages with no baseline average but measurement at index 7
      mockCalculationService.getAverage.mockImplementation((measurements, field, start, end) => {
        if (start === 0 && end === 7) {
          return { weight: 75.3, bodyFat: 18.8, leanMass: 61.3 }[field];
        }
        return null; // No baseline average
      });

      const trendSpy = jest.spyOn(uiManager, 'updateTrend');

      uiManager.updateSevenDayStats(measurements, true);

      expect(trendSpy).toHaveBeenCalledWith('avgWeightTrend', 75.3, 76.0, 'kg');
      expect(trendSpy).toHaveBeenCalledWith('avgBodyFatTrend', 18.8, 19.5, '%');
      expect(trendSpy).toHaveBeenCalledWith('avgLeanMassTrend', 61.3, 62.0, 'kg');
    });

    test('should show neutral trends when no baseline data', () => {
      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '', innerHTML: '' };
        return mockElements[id];
      });

      // Mock averages with no baseline and no measurement at index 7
      mockCalculationService.getAverage.mockImplementation((measurements, field, start, end) => {
        if (start === 0 && end === 7) {
          return { weight: 75.3, bodyFat: 18.8, leanMass: 61.3 }[field];
        }
        return null;
      });

      const trendSpy = jest.spyOn(uiManager, 'updateTrend');
      const shortMeasurements = measurements.slice(0, 6); // No measurement at index 7

      uiManager.updateSevenDayStats(shortMeasurements, true);

      expect(trendSpy).toHaveBeenCalledWith('avgWeightTrend', 75.3, 75.3, 'kg');
      expect(trendSpy).toHaveBeenCalledWith('avgBodyFatTrend', 18.8, 18.8, '%');
      expect(trendSpy).toHaveBeenCalledWith('avgLeanMassTrend', 61.3, 61.3, 'kg');
    });

    test('should update average BMI', () => {
      const mockElements = {};
      global.document.getElementById.mockImplementation((id) => {
        mockElements[id] = { textContent: '', innerHTML: '' };
        return mockElements[id];
      });

      mockCalculationService.getAverage.mockImplementation((measurements, field, start, end) => {
        if (start === 0 && end === 7) {
          return { weight: 75.3, bodyFat: 18.8, leanMass: 61.3 }[field];
        }
        return null;
      });

      const bmiSpy = jest.spyOn(uiManager, 'updateAverageBMI');

      uiManager.updateSevenDayStats(measurements, true);

      expect(bmiSpy).toHaveBeenCalledWith(75.3);
    });
  });
});