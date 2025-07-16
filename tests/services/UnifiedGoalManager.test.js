const UnifiedGoalManager = require('../../js/features/UnifiedGoalManager');
const CalculationService = require('../../js/services/CalculationService');
const DataManager = require('../../js/services/DataManager');

describe('UnifiedGoalManager', () => {
  let unifiedGoalManager;
  let calculationService;
  let dataManager;
  let mockContainer;
  let mockMeasurements;
  let mockGoals;
  let consoleWarnSpy;

  beforeEach(() => {
    // Mock DOM elements
    mockContainer = {
      innerHTML: ''
    };
    
    global.document = {
      getElementById: jest.fn(() => mockContainer)
    };

    // Mock console.warn for testing deprecation warnings
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    calculationService = new CalculationService();
    dataManager = new DataManager();
    unifiedGoalManager = new UnifiedGoalManager(calculationService, dataManager);

    // Setup mock measurements with progressive data
    const baseDate = new Date('2025-07-01');
    mockMeasurements = [];
    
    for (let i = 0; i < 15; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i * 7); // Weekly measurements
      mockMeasurements.push({
        date: date.toISOString().split('T')[0],
        weight: 75 + (i * 0.2), // Gradual weight gain
        bodyFat: 15 - (i * 0.1), // Gradual body fat loss
        leanMass: 45 + (i * 0.15) // Gradual lean mass gain
      });
    }
    
    // Reverse to get most recent first (as expected by the service)
    mockMeasurements.reverse();

    // Setup mock goals
    mockGoals = {
      weight: 78,
      bodyFat: 12,
      leanMass: 48
    };
  });

  afterEach(() => {
    delete global.document;
    consoleWarnSpy.mockRestore();
  });

  describe('Constructor', () => {
    test('should initialize with required services', () => {
      expect(unifiedGoalManager.calculationService).toBe(calculationService);
      expect(unifiedGoalManager.dataManager).toBe(dataManager);
      expect(unifiedGoalManager.periods).toEqual({
        sevenDay: 7,
        thirtyDay: 30,
        ninetyDay: 90
      });
    });
  });

  describe('updateUnifiedGoalProgress', () => {
    test('should show empty state when no measurements', () => {
      unifiedGoalManager.updateUnifiedGoalProgress([], mockGoals);
      
      expect(mockContainer.innerHTML).toContain('empty-state');
      expect(mockContainer.innerHTML).toContain('Add measurements to track goal progress');
    });

    test('should show empty state when measurements is null', () => {
      unifiedGoalManager.updateUnifiedGoalProgress(null, mockGoals);
      
      expect(mockContainer.innerHTML).toContain('empty-state');
      expect(mockContainer.innerHTML).toContain('Add measurements to track goal progress');
    });

    test('should always show all three metric cards regardless of goal status', () => {
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, {});
      
      expect(mockContainer.innerHTML).toContain('Weight');
      expect(mockContainer.innerHTML).toContain('Body Fat');
      expect(mockContainer.innerHTML).toContain('Lean Mass');
      expect(mockContainer.innerHTML).toContain('No goal set');
    });

    test('should show all three metric cards when all goals are set', () => {
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, mockGoals);
      
      expect(mockContainer.innerHTML).toContain('Weight');
      expect(mockContainer.innerHTML).toContain('Body Fat');
      expect(mockContainer.innerHTML).toContain('Lean Mass');
      expect(mockContainer.innerHTML).toContain('goal-progress-bar');
    });

    test('should show mixed states when some goals are set', () => {
      const mixedGoals = { weight: 78, bodyFat: null, leanMass: 48 };
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, mixedGoals);
      
      expect(mockContainer.innerHTML).toContain('Weight');
      expect(mockContainer.innerHTML).toContain('Body Fat');
      expect(mockContainer.innerHTML).toContain('Lean Mass');
      expect(mockContainer.innerHTML).toContain('goal-progress-bar');
      expect(mockContainer.innerHTML).toContain('No goal set');
    });

    test('should handle missing container element', () => {
      global.document.getElementById = jest.fn(() => null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, mockGoals);
      
      expect(consoleSpy).toHaveBeenCalledWith('UnifiedGoalManager: unifiedGoalProgress container not found');
      consoleSpy.mockRestore();
    });

    test('should include progress sections only when hasAnyGoal is true', () => {
      // Test with no goals - should not include progress sections
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, {});
      const noGoalHTML = mockContainer.innerHTML;
      expect(noGoalHTML).not.toContain('goal-progress-bar');
      
      // Test with goals - should include progress sections
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, mockGoals);
      const withGoalsHTML = mockContainer.innerHTML;
      expect(withGoalsHTML).toContain('goal-progress-bar');
    });

    test('should handle imperial units correctly', () => {
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, mockGoals, false);
      
      expect(mockContainer.innerHTML).toContain('lbs');
      expect(mockContainer.innerHTML).not.toContain('kg');
    });
  });

  describe('renderGoalCard', () => {
    test('should render goal card with goal set', () => {
      const html = unifiedGoalManager.renderGoalCard('weight', 'Weight', 75, 78, mockMeasurements, true, true);
      
      expect(html).toContain('unified-goal-card');
      expect(html).toContain('Weight');
      expect(html).toContain('75.0 kg');
      expect(html).toContain('78.0 kg');
      expect(html).toContain('goal-progress-bar');
      expect(html).toContain('goal-insights-grid');
    });

    test('should render goal card without goal set', () => {
      const html = unifiedGoalManager.renderGoalCard('weight', 'Weight', 75, null, mockMeasurements, true, false);
      
      expect(html).toContain('unified-goal-card');
      expect(html).toContain('Weight');
      expect(html).toContain('75.0 kg');
      expect(html).toContain('No goal set');
      expect(html).toContain('clickable');
      expect(html).not.toContain('goal-progress-bar');
      expect(html).toContain('goal-insights-grid');
    });

    test('should handle body fat percentage correctly', () => {
      const html = unifiedGoalManager.renderGoalCard('bodyFat', 'Body Fat', 15, 12, mockMeasurements, true, true);
      
      expect(html).toContain('Body Fat');
      expect(html).toContain('15.0 %');
      expect(html).toContain('12.0 %');
    });

    test('should handle imperial units for weight and lean mass', () => {
      const html = unifiedGoalManager.renderGoalCard('weight', 'Weight', 75, 78, mockMeasurements, false, true);
      
      expect(html).toContain('lbs');
      expect(html).not.toContain('kg');
    });
  });

  describe('calculateInsightsForMetric', () => {
    test('should return null for insufficient measurements', () => {
      const singleMeasurement = [mockMeasurements[0]];
      const insights = unifiedGoalManager.calculateInsightsForMetric(singleMeasurement, 'weight');
      
      expect(insights).toBeNull();
    });

    test('should calculate insights for all three periods', () => {
      const insights = unifiedGoalManager.calculateInsightsForMetric(mockMeasurements, 'weight');
      
      expect(insights).toBeDefined();
      expect(insights).toHaveProperty('sevenDay');
      expect(insights).toHaveProperty('thirtyDay');
      expect(insights).toHaveProperty('ninetyDay');
    });

    test('should handle periods with insufficient data', () => {
      // Use only 1 measurement to ensure insufficient data for all periods
      const today = new Date();
      const singleMeasurement = [
        {
          date: today.toISOString().split('T')[0],
          weight: 75,
          bodyFat: 15,
          leanMass: 45
        }
      ];
      
      const insights = unifiedGoalManager.calculateInsightsForMetric(singleMeasurement, 'weight');
      
      // Should return null for less than 2 measurements
      expect(insights).toBeNull();
    });

    test('should calculate correct weight change', () => {
      const insights = unifiedGoalManager.calculateInsightsForMetric(mockMeasurements, 'weight');
      
      expect(insights.sevenDay).toBeGreaterThan(0); // Weight should be increasing
      expect(typeof insights.sevenDay).toBe('number');
    });

    test('should calculate correct body fat change', () => {
      const insights = unifiedGoalManager.calculateInsightsForMetric(mockMeasurements, 'bodyFat');
      
      expect(insights.sevenDay).toBeLessThan(0); // Body fat should be decreasing
      expect(typeof insights.sevenDay).toBe('number');
    });
  });

  describe('renderGoalHeader', () => {
    test('should render header with goal set', () => {
      const html = unifiedGoalManager.renderGoalHeader('Weight', 75, 78, 'kg', true);
      
      expect(html).toContain('goal-header');
      expect(html).toContain('Weight');
      expect(html).toContain('75.0 kg');
      expect(html).toContain('78.0 kg');
      expect(html).toContain('goal-arrow');
    });

    test('should render header without goal set', () => {
      const html = unifiedGoalManager.renderGoalHeader('Weight', 75, null, 'kg', false);
      
      expect(html).toContain('goal-header');
      expect(html).toContain('Weight');
      expect(html).toContain('75.0 kg');
      expect(html).toContain('No goal set');
      expect(html).toContain('clickable');
      expect(html).toContain('onclick');
    });
  });

  describe('renderGoalProgress', () => {
    test('should render progress bar with goal set', () => {
      const html = unifiedGoalManager.renderGoalProgress(75, 78, 50, 'kg', true);
      
      expect(html).toContain('goal-progress');
      expect(html).toContain('goal-progress-bar');
      expect(html).toContain('width: 50%');
      expect(html).toContain('3.0 kg to go');
      expect(html).toContain('(50%)');
    });

    test('should render minimal progress without goal set', () => {
      const html = unifiedGoalManager.renderGoalProgress(75, null, null, 'kg', false);
      
      expect(html).toContain('goal-progress');
      expect(html).toContain('goal-no-progress-minimal');
      expect(html).not.toContain('goal-progress-bar');
    });

    test('should show goal achieved message', () => {
      const html = unifiedGoalManager.renderGoalProgress(78, 78, 100, 'kg', true);
      
      expect(html).toContain('Goal achieved!');
    });

    test('should handle very small remaining values', () => {
      const html = unifiedGoalManager.renderGoalProgress(77.95, 78, 99, 'kg', true);
      
      expect(html).toContain('Goal achieved!');
    });
  });

  describe('renderGoalInsights', () => {
    test('should render insights grid with data', () => {
      const insights = {
        sevenDay: 0.5,
        thirtyDay: 1.2,
        ninetyDay: 2.8
      };
      
      const html = unifiedGoalManager.renderGoalInsights(insights, 'weight', true);
      
      expect(html).toContain('goal-insights');
      expect(html).toContain('goal-insights-grid');
      expect(html).toContain('7-Day');
      expect(html).toContain('30-Day');
      expect(html).toContain('90-Day');
      expect(html).toContain('+0.5 kg');
      expect(html).toContain('+1.2 kg');
      expect(html).toContain('+2.8 kg');
    });

    test('should render empty state when no insights', () => {
      const html = unifiedGoalManager.renderGoalInsights(null, 'weight', true);
      
      expect(html).toContain('goal-insights');
      expect(html).toContain('goal-insights-empty');
      expect(html).toContain('Add more measurements to see progress insights');
    });

    test('should handle null values in insights', () => {
      const insights = {
        sevenDay: 0.5,
        thirtyDay: null,
        ninetyDay: 2.8
      };
      
      const html = unifiedGoalManager.renderGoalInsights(insights, 'weight', true);
      
      expect(html).toContain('+0.5 kg');
      expect(html).toContain('N/A');
      expect(html).toContain('+2.8 kg');
      expect(html).toContain('insufficient-data');
    });
  });

  describe('renderGoalTimeline', () => {
    test('should render timeline with successful estimate', () => {
      const timeline = {
        success: true,
        daysToGoal: 45,
        targetDate: new Date('2025-09-15'),
        confidence: 'high',
        dailyRate: 0.1,
        achievable: true
      };
      
      const html = unifiedGoalManager.renderGoalTimeline(timeline, 'kg', true);
      
      expect(html).toContain('goal-timeline');
      expect(html).toContain('achievable');
      expect(html).toContain('high confidence');
      expect(html).toContain('0.10 kg/day');
      expect(html).toContain('9/15/2025');
    });

    test('should render no goal message when goal not set', () => {
      const html = unifiedGoalManager.renderGoalTimeline(null, 'kg', false);
      
      expect(html).toContain('goal-timeline');
      expect(html).toContain('Set a goal to see timeline estimate');
      expect(html).toContain('timeline-info');
    });

    test('should handle different failure reasons', () => {
      const testCases = [
        { reason: 'insufficient_data', expectedMessage: 'Need more measurement data for timeline estimation' },
        { reason: 'goal_achieved', expectedMessage: 'Goal already achieved! 🎉' },
        { reason: 'trend_too_weak', expectedMessage: 'Trend too weak for reliable prediction' },
        { reason: 'timeline_too_long', expectedMessage: 'Goal timeline too long to predict reliably' },
        { reason: 'invalid_timeline', expectedMessage: 'Current trend goes in opposite direction from goal' }
      ];

      testCases.forEach(({ reason, expectedMessage }) => {
        const timeline = { success: false, reason };
        const html = unifiedGoalManager.renderGoalTimeline(timeline, 'kg', true);
        
        expect(html).toContain(expectedMessage);
      });
    });

    test('should handle different confidence levels', () => {
      const confidenceLevels = ['high', 'medium', 'low'];
      
      confidenceLevels.forEach(confidence => {
        const timeline = {
          success: true,
          daysToGoal: 30,
          targetDate: new Date('2025-08-15'),
          confidence,
          dailyRate: 0.1,
          achievable: true
        };
        
        const html = unifiedGoalManager.renderGoalTimeline(timeline, 'kg', true);
        
        expect(html).toContain(`confidence-${confidence}`);
        expect(html).toContain(`${confidence} confidence`);
      });
    });
  });

  describe('Helper Methods', () => {
    describe('filterMeasurementsByDate', () => {
      test('should filter measurements by start date', () => {
        const startDate = new Date('2025-07-15');
        const filtered = unifiedGoalManager.filterMeasurementsByDate(mockMeasurements, startDate);
        
        expect(filtered.length).toBeLessThan(mockMeasurements.length);
        filtered.forEach(measurement => {
          expect(new Date(measurement.date)).toBeInstanceOf(Date);
        });
      });

      test('should return empty array for empty measurements', () => {
        const startDate = new Date('2025-07-15');
        const filtered = unifiedGoalManager.filterMeasurementsByDate([], startDate);
        
        expect(filtered).toEqual([]);
      });

      test('should return empty array for null measurements', () => {
        const startDate = new Date('2025-07-15');
        const filtered = unifiedGoalManager.filterMeasurementsByDate(null, startDate);
        
        expect(filtered).toEqual([]);
      });
    });

    describe('getDisplayUnit', () => {
      test('should return correct units for different fields', () => {
        expect(unifiedGoalManager.getDisplayUnit('weight', true)).toBe('kg');
        expect(unifiedGoalManager.getDisplayUnit('weight', false)).toBe('lbs');
        expect(unifiedGoalManager.getDisplayUnit('leanMass', true)).toBe('kg');
        expect(unifiedGoalManager.getDisplayUnit('leanMass', false)).toBe('lbs');
        expect(unifiedGoalManager.getDisplayUnit('bodyFat', true)).toBe('%');
        expect(unifiedGoalManager.getDisplayUnit('bodyFat', false)).toBe('%');
        expect(unifiedGoalManager.getDisplayUnit('unknown', true)).toBe('');
      });
    });

    describe('convertForDisplay', () => {
      test('should convert weight for imperial display', () => {
        const converted = unifiedGoalManager.convertForDisplay(75, 'weight', false);
        expect(converted).toBeGreaterThan(160); // 75kg ≈ 165lbs
      });

      test('should not convert for metric display', () => {
        const converted = unifiedGoalManager.convertForDisplay(75, 'weight', true);
        expect(converted).toBe(75);
      });

      test('should not convert body fat regardless of unit', () => {
        const converted = unifiedGoalManager.convertForDisplay(15, 'bodyFat', false);
        expect(converted).toBe(15);
      });
    });

    describe('getChangeClass', () => {
      test('should return correct CSS classes for changes', () => {
        expect(unifiedGoalManager.getChangeClass(1.5)).toBe('positive-change');
        expect(unifiedGoalManager.getChangeClass(-1.5)).toBe('negative-change');
        expect(unifiedGoalManager.getChangeClass(0)).toBe('no-change');
      });
    });

    describe('formatChange', () => {
      test('should format positive changes with plus sign', () => {
        expect(unifiedGoalManager.formatChange(1.5, 'kg')).toBe('+1.5 kg');
      });

      test('should format negative changes with minus sign', () => {
        expect(unifiedGoalManager.formatChange(-1.5, 'kg')).toBe('-1.5 kg');
      });

      test('should format zero changes with plus sign', () => {
        expect(unifiedGoalManager.formatChange(0, 'kg')).toBe('+0.0 kg');
      });
    });
  });

  describe('Backwards Compatibility', () => {
    test('should show deprecation warning for updateGoalProgress', () => {
      unifiedGoalManager.updateGoalProgress(mockMeasurements, mockGoals);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'UnifiedGoalManager: updateGoalProgress is deprecated, use updateUnifiedGoalProgress instead'
      );
    });

    test('should show deprecation warning for updateInsights', () => {
      unifiedGoalManager.updateInsights(mockMeasurements);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'UnifiedGoalManager: updateInsights is deprecated, insights are now integrated into goal cards'
      );
    });

    test('should delegate updateGoalProgress to updateUnifiedGoalProgress', () => {
      const spy = jest.spyOn(unifiedGoalManager, 'updateUnifiedGoalProgress');
      
      unifiedGoalManager.updateGoalProgress(mockMeasurements, mockGoals, false);
      
      expect(spy).toHaveBeenCalledWith(mockMeasurements, mockGoals, false);
      spy.mockRestore();
    });

    test('should handle calculateInsightsForGoal backwards compatibility', () => {
      const insights = unifiedGoalManager.calculateInsightsForGoal(mockMeasurements, 'weight', 75, 78);
      
      expect(insights).toBeDefined();
      expect(insights).toHaveProperty('sevenDay');
      expect(insights).toHaveProperty('thirtyDay');
      expect(insights).toHaveProperty('ninetyDay');
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with CalculationService for goal progress', () => {
      const spy = jest.spyOn(calculationService, 'calculateGoalProgress');
      
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, mockGoals);
      
      expect(spy).toHaveBeenCalledTimes(3); // Once for each metric
      spy.mockRestore();
    });

    test('should integrate with CalculationService for timeline estimation', () => {
      const spy = jest.spyOn(calculationService, 'estimateGoalTimeline');
      
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, mockGoals);
      
      expect(spy).toHaveBeenCalledTimes(3); // Once for each metric
      spy.mockRestore();
    });

    test('should integrate with CalculationService for unit conversion', () => {
      const spy = jest.spyOn(calculationService, 'convertWeight');
      
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, mockGoals, false);
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle measurements with missing fields', () => {
      const incompleteData = [
        { date: '2025-07-01', weight: 75 },
        { date: '2025-07-02', weight: 75.5 }
      ];
      
      expect(() => {
        unifiedGoalManager.updateUnifiedGoalProgress(incompleteData, mockGoals);
      }).not.toThrow();
      
      // Should show N/A for missing fields
      expect(mockContainer.innerHTML).toContain('N/A %'); // Body fat missing
      expect(mockContainer.innerHTML).toContain('N/A kg'); // Lean mass missing
    });

    test('should handle undefined goal values', () => {
      const undefinedGoals = { weight: undefined, bodyFat: undefined, leanMass: undefined };
      
      expect(() => {
        unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, undefinedGoals);
      }).not.toThrow();
      
      expect(mockContainer.innerHTML).toContain('No goal set');
    });

    test('should handle malformed dates in measurements', () => {
      const malformedData = [
        { date: 'invalid-date', weight: 75, bodyFat: 15, leanMass: 45 },
        { date: '2025-07-01', weight: 75.5, bodyFat: 15.1, leanMass: 45.1 }
      ];
      
      expect(() => {
        unifiedGoalManager.updateUnifiedGoalProgress(malformedData, mockGoals);
      }).not.toThrow();
    });

    test('should handle very large and very small values', () => {
      const extremeData = [
        { date: '2025-07-01', weight: 1000, bodyFat: 0.1, leanMass: 999 },
        { date: '2025-07-02', weight: 0.1, bodyFat: 99.9, leanMass: 0.1 }
      ];
      
      expect(() => {
        unifiedGoalManager.updateUnifiedGoalProgress(extremeData, mockGoals);
      }).not.toThrow();
    });

    test('should handle goals with negative values', () => {
      const negativeGoals = { weight: -10, bodyFat: -5, leanMass: -20 };
      
      expect(() => {
        unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, negativeGoals);
      }).not.toThrow();
    });

    test('should handle mixed goal types (some null, some undefined, some valid)', () => {
      const mixedGoals = { weight: 78, bodyFat: null, leanMass: undefined };
      
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, mixedGoals);
      
      expect(mockContainer.innerHTML).toContain('Weight');
      expect(mockContainer.innerHTML).toContain('Body Fat');
      expect(mockContainer.innerHTML).toContain('Lean Mass');
      expect(mockContainer.innerHTML).toContain('goal-progress-bar');
      expect(mockContainer.innerHTML).toContain('No goal set');
    });
  });

  describe('Performance and Optimization', () => {
    test('should not recalculate insights unnecessarily', () => {
      const spy = jest.spyOn(unifiedGoalManager, 'calculateInsightsForMetric');
      
      unifiedGoalManager.updateUnifiedGoalProgress(mockMeasurements, mockGoals);
      
      expect(spy).toHaveBeenCalledTimes(3); // Once for each metric
      spy.mockRestore();
    });

    test('should handle large datasets efficiently', () => {
      // Create a large dataset
      const largeDataset = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          weight: 75 + Math.random() * 10,
          bodyFat: 15 + Math.random() * 5,
          leanMass: 45 + Math.random() * 8
        });
      }
      
      const startTime = Date.now();
      unifiedGoalManager.updateUnifiedGoalProgress(largeDataset, mockGoals);
      const endTime = Date.now();
      
      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});