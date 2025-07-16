const UnifiedGoalManager = require('../../js/features/UnifiedGoalManager');
const CalculationService = require('../../js/services/CalculationService');
const DataManager = require('../../js/services/DataManager');

describe('UnifiedGoalManager Integration Tests', () => {
  let unifiedGoalManager;
  let calculationService;
  let dataManager;
  let mockContainer;
  let mockApp;

  beforeEach(() => {
    // Mock DOM elements
    mockContainer = {
      innerHTML: ''
    };
    
    global.document = {
      getElementById: jest.fn((id) => {
        if (id === 'unifiedGoalProgress') return mockContainer;
        if (id === 'toggleGoalForm') return { click: jest.fn() };
        return null;
      })
    };

    // Create services
    calculationService = new CalculationService();
    dataManager = new DataManager();
    unifiedGoalManager = new UnifiedGoalManager(calculationService, dataManager);

    // Mock app-like object
    mockApp = {
      measurements: [
        {
          date: '2025-07-15',
          weight: 75.5,
          bodyFat: 15.2,
          leanMass: 44.8
        },
        {
          date: '2025-07-08',
          weight: 75.0,
          bodyFat: 15.5,
          leanMass: 44.5
        },
        {
          date: '2025-07-01',
          weight: 74.8,
          bodyFat: 15.8,
          leanMass: 44.2
        }
      ],
      goals: {
        weight: 78,
        bodyFat: 12,
        leanMass: 48
      },
      useMetric: true
    };
  });

  afterEach(() => {
    delete global.document;
  });

  describe('Full Application Integration', () => {
    test('should integrate with app data flow', () => {
      // Simulate app calling unified goal manager
      unifiedGoalManager.updateUnifiedGoalProgress(
        mockApp.measurements,
        mockApp.goals,
        mockApp.useMetric
      );

      // Verify DOM output
      expect(mockContainer.innerHTML).toContain('unified-goal-card');
      expect(mockContainer.innerHTML).toContain('Weight');
      expect(mockContainer.innerHTML).toContain('Body Fat');
      expect(mockContainer.innerHTML).toContain('Lean Mass');
      expect(mockContainer.innerHTML).toContain('75.5 kg');
      expect(mockContainer.innerHTML).toContain('78.0 kg');
      expect(mockContainer.innerHTML).toContain('goal-progress-bar');
      expect(mockContainer.innerHTML).toContain('goal-insights-grid');
    });

    test('should handle unit conversion in integrated context', () => {
      // Test imperial units
      unifiedGoalManager.updateUnifiedGoalProgress(
        mockApp.measurements,
        mockApp.goals,
        false // Use imperial
      );

      expect(mockContainer.innerHTML).toContain('lbs');
      expect(mockContainer.innerHTML).not.toContain('kg');
      // Weight should be converted: 75.5 kg ≈ 166.4 lbs
      expect(mockContainer.innerHTML).toContain('166.4 lbs');
    });

    test('should handle empty application state', () => {
      // Test with no measurements
      unifiedGoalManager.updateUnifiedGoalProgress(
        [],
        mockApp.goals,
        mockApp.useMetric
      );

      expect(mockContainer.innerHTML).toContain('empty-state');
      expect(mockContainer.innerHTML).toContain('Add measurements to track goal progress');
    });

    test('should handle no goals set', () => {
      // Test with no goals
      unifiedGoalManager.updateUnifiedGoalProgress(
        mockApp.measurements,
        {},
        mockApp.useMetric
      );

      expect(mockContainer.innerHTML).toContain('Weight');
      expect(mockContainer.innerHTML).toContain('Body Fat');
      expect(mockContainer.innerHTML).toContain('Lean Mass');
      expect(mockContainer.innerHTML).toContain('No goal set');
      expect(mockContainer.innerHTML).toContain('clickable');
      expect(mockContainer.innerHTML).not.toContain('goal-progress-bar');
    });
  });

  describe('Service Integration', () => {
    test('should properly integrate with CalculationService', () => {
      // Mock the calculation service methods
      const calculateGoalProgressSpy = jest.spyOn(calculationService, 'calculateGoalProgress');
      const estimateGoalTimelineSpy = jest.spyOn(calculationService, 'estimateGoalTimeline');
      const convertWeightSpy = jest.spyOn(calculationService, 'convertWeight');

      unifiedGoalManager.updateUnifiedGoalProgress(
        mockApp.measurements,
        mockApp.goals,
        false // Imperial to test conversion
      );

      // Verify calculation service methods were called
      expect(calculateGoalProgressSpy).toHaveBeenCalledTimes(3); // Once for each metric
      expect(estimateGoalTimelineSpy).toHaveBeenCalledTimes(3); // Once for each metric
      expect(convertWeightSpy).toHaveBeenCalled(); // For imperial conversion

      calculateGoalProgressSpy.mockRestore();
      estimateGoalTimelineSpy.mockRestore();
      convertWeightSpy.mockRestore();
    });

    test('should handle CalculationService errors gracefully', () => {
      // Mock calculation service to throw error
      jest.spyOn(calculationService, 'calculateGoalProgress').mockImplementation(() => {
        throw new Error('Calculation error');
      });

      // Should not crash the application
      expect(() => {
        unifiedGoalManager.updateUnifiedGoalProgress(
          mockApp.measurements,
          mockApp.goals,
          mockApp.useMetric
        );
      }).not.toThrow();
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle partial data in real application', () => {
      // Simulate real-world scenario with missing data
      const partialMeasurements = [
        {
          date: '2025-07-15',
          weight: 75.5,
          bodyFat: 15.2,
          // Missing leanMass
        },
        {
          date: '2025-07-08',
          weight: 75.0,
          // Missing bodyFat and leanMass
        }
      ];

      const partialGoals = {
        weight: 78,
        // Missing bodyFat and leanMass goals
      };

      expect(() => {
        unifiedGoalManager.updateUnifiedGoalProgress(
          partialMeasurements,
          partialGoals,
          mockApp.useMetric
        );
      }).not.toThrow();

      // Should still show all three cards
      expect(mockContainer.innerHTML).toContain('Weight');
      expect(mockContainer.innerHTML).toContain('Body Fat');
      expect(mockContainer.innerHTML).toContain('Lean Mass');
      expect(mockContainer.innerHTML).toContain('N/A');
    });

    test('should handle user interaction flow', () => {
      // Test the clickable "No goal set" functionality
      const partialGoals = { weight: 78 };
      
      unifiedGoalManager.updateUnifiedGoalProgress(
        mockApp.measurements,
        partialGoals,
        mockApp.useMetric
      );

      // Should have clickable "No goal set" for bodyFat and leanMass
      expect(mockContainer.innerHTML).toContain('No goal set');
      expect(mockContainer.innerHTML).toContain('clickable');
      expect(mockContainer.innerHTML).toContain('onclick');
      expect(mockContainer.innerHTML).toContain('toggleGoalForm');
    });

    test('should handle dynamic goal changes', () => {
      // Test changing goals dynamically
      const initialGoals = { weight: 78 };
      const updatedGoals = { weight: 78, bodyFat: 12, leanMass: 48 };

      // Initial state with partial goals
      unifiedGoalManager.updateUnifiedGoalProgress(
        mockApp.measurements,
        initialGoals,
        mockApp.useMetric
      );

      const initialHTML = mockContainer.innerHTML;
      expect(initialHTML).toContain('No goal set');
      expect(initialHTML).toContain('goal-progress-bar');

      // Updated state with all goals
      unifiedGoalManager.updateUnifiedGoalProgress(
        mockApp.measurements,
        updatedGoals,
        mockApp.useMetric
      );

      const updatedHTML = mockContainer.innerHTML;
      expect(updatedHTML).toContain('goal-progress-bar');
      expect(updatedHTML).toContain('12.0 %');
      expect(updatedHTML).toContain('48.0 kg');
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle frequent updates without memory leaks', () => {
      // Simulate frequent updates like in real app
      for (let i = 0; i < 100; i++) {
        unifiedGoalManager.updateUnifiedGoalProgress(
          mockApp.measurements,
          mockApp.goals,
          mockApp.useMetric
        );
      }

      // Should still work correctly
      expect(mockContainer.innerHTML).toContain('unified-goal-card');
      expect(mockContainer.innerHTML).toContain('Weight');
      expect(mockContainer.innerHTML).toContain('Body Fat');
      expect(mockContainer.innerHTML).toContain('Lean Mass');
    });

    test('should handle large datasets efficiently', () => {
      // Create large dataset
      const largeMeasurements = [];
      for (let i = 0; i < 1000; i++) {
        largeMeasurements.push({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          weight: 75 + Math.random() * 10,
          bodyFat: 15 + Math.random() * 5,
          leanMass: 45 + Math.random() * 8
        });
      }

      const startTime = Date.now();
      unifiedGoalManager.updateUnifiedGoalProgress(
        largeMeasurements,
        mockApp.goals,
        mockApp.useMetric
      );
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(500);
      expect(mockContainer.innerHTML).toContain('unified-goal-card');
    });
  });

  describe('Cross-browser Compatibility', () => {
    test('should work with different DOM implementations', () => {
      // Test with different container implementations
      const alternativeContainer = {
        innerHTML: '',
        appendChild: jest.fn(),
        removeChild: jest.fn()
      };

      global.document.getElementById = jest.fn(() => alternativeContainer);

      expect(() => {
        unifiedGoalManager.updateUnifiedGoalProgress(
          mockApp.measurements,
          mockApp.goals,
          mockApp.useMetric
        );
      }).not.toThrow();

      expect(alternativeContainer.innerHTML).toContain('unified-goal-card');
    });
  });
});