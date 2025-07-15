const GoalManager = require('../../js/features/GoalManager');
const CalculationService = require('../../js/services/CalculationService');
const DataManager = require('../../js/services/DataManager');

describe('GoalManager', () => {
  let goalManager;
  let calculationService;
  let dataManager;
  let mockContainer;

  beforeEach(() => {
    // Mock DOM elements
    mockContainer = {
      innerHTML: ''
    };
    
    global.document = {
      getElementById: jest.fn(() => mockContainer)
    };

    calculationService = new CalculationService();
    dataManager = new DataManager();
    goalManager = new GoalManager(calculationService, dataManager);
  });

  afterEach(() => {
    delete global.document;
  });

  describe('updateGoalProgress', () => {
    test('should show empty state when no measurements', () => {
      const goals = { weight: 70, bodyFat: 10, leanMass: 50 };
      
      goalManager.updateGoalProgress([], goals);
      
      expect(mockContainer.innerHTML).toContain('Add measurements to track goal progress');
    });

    test('should show empty state when measurements is null', () => {
      const goals = { weight: 70, bodyFat: 10, leanMass: 50 };
      
      goalManager.updateGoalProgress(null, goals);
      
      expect(mockContainer.innerHTML).toContain('Add measurements to track goal progress');
    });

    test('should show goal setting message when no goals set', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 }
      ];
      
      goalManager.updateGoalProgress(measurements, {});
      
      expect(mockContainer.innerHTML).toContain('Set your goals above to track progress');
    });

    test('should render weight goal progress', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 },
        { weight: 80, bodyFat: 15, leanMass: 40 }
      ];
      const goals = { weight: 70 };
      
      goalManager.updateGoalProgress(measurements, goals);
      
      expect(mockContainer.innerHTML).toContain('Weight');
      expect(mockContainer.innerHTML).toContain('5.0 kg to go');
    });

    test('should render body fat goal progress', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 },
        { weight: 80, bodyFat: 15, leanMass: 40 }
      ];
      const goals = { bodyFat: 10 };
      
      goalManager.updateGoalProgress(measurements, goals);
      
      expect(mockContainer.innerHTML).toContain('Body Fat');
      expect(mockContainer.innerHTML).toContain('2.0 % to go');
    });

    test('should render lean mass goal progress', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 },
        { weight: 80, bodyFat: 15, leanMass: 40 }
      ];
      const goals = { leanMass: 50 };
      
      goalManager.updateGoalProgress(measurements, goals);
      
      expect(mockContainer.innerHTML).toContain('Lean Mass');
      expect(mockContainer.innerHTML).toContain('5.0 kg to go');
    });

    test('should show goal achieved when target is reached', () => {
      const measurements = [
        { weight: 70, bodyFat: 10, leanMass: 50 }
      ];
      const goals = { weight: 70, bodyFat: 10, leanMass: 50 };
      
      goalManager.updateGoalProgress(measurements, goals);
      
      expect(mockContainer.innerHTML).toContain('Goal achieved!');
    });

    test('should handle imperial units for weight', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 }
      ];
      const goals = { weight: 70 };
      
      goalManager.updateGoalProgress(measurements, goals, false);
      
      expect(mockContainer.innerHTML).toContain('lbs');
    });

    test('should handle imperial units for lean mass', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 }
      ];
      const goals = { leanMass: 50 };
      
      goalManager.updateGoalProgress(measurements, goals, false);
      
      expect(mockContainer.innerHTML).toContain('lbs');
    });
  });

  describe('calculateProgress', () => {
    test('should calculate weight goal progress correctly', () => {
      const measurements = [
        { weight: 75 },
        { weight: 80 }
      ];
      
      const progress = goalManager.calculateProgress(75, 70, false, measurements);
      
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    test('should calculate body fat goal progress correctly', () => {
      const measurements = [
        { bodyFat: 12 },
        { bodyFat: 15 }
      ];
      
      const progress = goalManager.calculateProgress(12, 10, true, measurements);
      
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  describe('renderGoalProgress', () => {
    test('should render progress bar with correct values', () => {
      const html = goalManager.renderGoalProgress('Weight', 75, 70, 50, 'kg');
      
      expect(html).toContain('Weight');
      expect(html).toContain('5.0 kg to go');
      expect(html).toContain('width: 50%');
      expect(html).toContain('goal-progress-item');
    });

    test('should show goal achieved when target is reached', () => {
      const html = goalManager.renderGoalProgress('Weight', 70, 70, 100, 'kg');
      
      expect(html).toContain('Goal achieved!');
    });

    test('should handle negative remaining values (over target)', () => {
      const html = goalManager.renderGoalProgress('Weight', 65, 70, 100, 'kg');
      
      expect(html).toContain('5.0 kg to go');
    });
  });

  describe('isGoalAchieved', () => {
    test('should return true when weight goal is achieved', () => {
      expect(goalManager.isGoalAchieved(70, 70, false)).toBe(true);
      expect(goalManager.isGoalAchieved(70.05, 70, false)).toBe(true);
    });

    test('should return false when weight goal is not achieved', () => {
      expect(goalManager.isGoalAchieved(75, 70, false)).toBe(false);
      expect(goalManager.isGoalAchieved(65, 70, false)).toBe(false);
    });

    test('should return true when body fat goal is achieved', () => {
      expect(goalManager.isGoalAchieved(10, 10, true)).toBe(true);
      expect(goalManager.isGoalAchieved(9, 10, true)).toBe(true);
    });

    test('should return false when body fat goal is not achieved', () => {
      expect(goalManager.isGoalAchieved(12, 10, true)).toBe(false);
    });
  });

  describe('formatGoalAchievement', () => {
    test('should format achievement message correctly', () => {
      expect(goalManager.formatGoalAchievement(70, 70, false)).toBe('Goal achieved!');
      expect(goalManager.formatGoalAchievement(75, 70, false)).toBe('5.0 over target');
      expect(goalManager.formatGoalAchievement(65, 70, false)).toBe('5.0 to go');
    });

    test('should handle body fat achievement correctly', () => {
      expect(goalManager.formatGoalAchievement(10, 10, true)).toBe('Goal achieved!');
      expect(goalManager.formatGoalAchievement(12, 10, true)).toBe('2.0 over target');
    });
  });

  describe('getGoalStatus', () => {
    test('should return complete goal status', () => {
      const measurements = [
        { weight: 75 },
        { weight: 80 }
      ];
      
      const status = goalManager.getGoalStatus(75, 70, false);
      
      expect(status).toHaveProperty('progress');
      expect(status).toHaveProperty('achieved');
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('message');
      expect(status.remaining).toBe(5);
    });
  });

  describe('updateGoalInputs', () => {
    test('should update goal input fields with metric values', () => {
      const mockInputs = {
        weight: { value: '' },
        bodyFat: { value: '' },
        leanMass: { value: '' }
      };
      
      global.document.getElementById = jest.fn((id) => {
        if (id === 'goalWeight') return mockInputs.weight;
        if (id === 'goalBodyFat') return mockInputs.bodyFat;
        if (id === 'goalLeanMass') return mockInputs.leanMass;
        return null;
      });
      
      const goals = { weight: 70, bodyFat: 10, leanMass: 50 };
      
      goalManager.updateGoalInputs(goals, 175, true);
      
      expect(mockInputs.weight.value).toBe('70.0');
      expect(mockInputs.bodyFat.value).toBe('10.0');
      expect(mockInputs.leanMass.value).toBe('50.0');
    });

    test('should update goal input fields with imperial values', () => {
      const mockInputs = {
        weight: { value: '' },
        leanMass: { value: '' }
      };
      
      global.document.getElementById = jest.fn((id) => {
        if (id === 'goalWeight') return mockInputs.weight;
        if (id === 'goalLeanMass') return mockInputs.leanMass;
        return null;
      });
      
      const goals = { weight: 70, leanMass: 50 };
      
      goalManager.updateGoalInputs(goals, 175, false);
      
      expect(parseFloat(mockInputs.weight.value)).toBeCloseTo(154.32, 1);
      expect(parseFloat(mockInputs.leanMass.value)).toBeCloseTo(110.23, 1);
    });
  });

  describe('getRecommendedGoals', () => {
    test('should return null when no measurements', () => {
      const recommendations = goalManager.getRecommendedGoals([], 175);
      
      expect(recommendations).toBeNull();
    });

    test('should recommend weight loss for high BMI', () => {
      const measurements = [
        { weight: 90, bodyFat: 25, leanMass: 67.5 }
      ];
      
      const recommendations = goalManager.getRecommendedGoals(measurements, 175);
      
      expect(recommendations.weight).toBeLessThan(90);
      expect(recommendations.weight).toBeCloseTo(73.5, 1);
    });

    test('should recommend weight gain for low BMI', () => {
      const measurements = [
        { weight: 50, bodyFat: 8, leanMass: 46 }
      ];
      
      const recommendations = goalManager.getRecommendedGoals(measurements, 175);
      
      expect(recommendations.weight).toBeGreaterThan(50);
      expect(recommendations.weight).toBeCloseTo(61.25, 1);
    });

    test('should recommend body fat reduction for high body fat', () => {
      const measurements = [
        { weight: 75, bodyFat: 25, leanMass: 56.25 }
      ];
      
      const recommendations = goalManager.getRecommendedGoals(measurements, 175);
      
      expect(recommendations.bodyFat).toBeLessThan(25);
      expect(recommendations.bodyFat).toBe(20);
    });

    test('should recommend lean mass increase', () => {
      const measurements = [
        { weight: 75, bodyFat: 15, leanMass: 63.75 }
      ];
      
      const recommendations = goalManager.getRecommendedGoals(measurements, 175);
      
      expect(recommendations.leanMass).toBe(64.75);
    });
  });

  describe('Timeline Estimation Functions', () => {
    let mockMeasurements;
    let mockGoals;

    beforeEach(() => {
      const baseDate = new Date('2025-07-01');
      mockMeasurements = [];
      
      for (let i = 0; i < 20; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        mockMeasurements.push({
          date: date.toISOString().split('T')[0],
          weight: 65 + (i * 0.1),
          bodyFat: 10 - (i * 0.05),
          leanMass: 42 + (i * 0.08)
        });
      }
      
      mockMeasurements.reverse();
      
      mockGoals = {
        weight: 70,
        bodyFat: 8,
        leanMass: 45
      };
    });

    describe('estimateGoalAchievement', () => {
      test('should estimate timeline for weight goal', () => {
        const estimates = goalManager.estimateGoalAchievement(mockMeasurements, mockGoals, true);
        
        expect(estimates).toBeDefined();
        expect(estimates.weight).toBeDefined();
        expect(estimates.weight.daysToGoal).toBeGreaterThan(0);
        expect(estimates.weight.targetDate).toBeInstanceOf(Date);
        expect(estimates.weight.confidence).toMatch(/^(high|medium|low)$/);
        expect(estimates.weight.currentValue).toBeDefined();
        expect(estimates.weight.goalValue).toBe(70);
        expect(estimates.weight.unit).toBe('kg');
        expect(estimates.weight.formatted).toBeDefined();
      });

      test('should estimate timeline for body fat goal', () => {
        const estimates = goalManager.estimateGoalAchievement(mockMeasurements, mockGoals, true);
        
        expect(estimates).toBeDefined();
        expect(estimates.bodyFat).toBeDefined();
        expect(estimates.bodyFat.daysToGoal).toBeGreaterThan(0);
        expect(estimates.bodyFat.goalValue).toBe(8);
        expect(estimates.bodyFat.unit).toBe('%');
        expect(estimates.bodyFat.dailyRate).toBeLessThan(0);
      });

      test('should estimate timeline for lean mass goal', () => {
        const estimates = goalManager.estimateGoalAchievement(mockMeasurements, mockGoals, true);
        
        expect(estimates).toBeDefined();
        expect(estimates.leanMass).toBeDefined();
        expect(estimates.leanMass.daysToGoal).toBeGreaterThan(0);
        expect(estimates.leanMass.goalValue).toBe(45);
        expect(estimates.leanMass.unit).toBe('kg');
        expect(estimates.leanMass.dailyRate).toBeGreaterThan(0);
      });

      test('should handle imperial units', () => {
        const estimates = goalManager.estimateGoalAchievement(mockMeasurements, mockGoals, false);
        
        expect(estimates).toBeDefined();
        if (estimates.weight) {
          expect(estimates.weight.unit).toBe('lbs');
          expect(estimates.weight.currentValue).toBeGreaterThan(140);
          expect(estimates.weight.goalValue).toBeGreaterThan(150);
        }
        if (estimates.leanMass) {
          expect(estimates.leanMass.unit).toBe('lbs');
          expect(estimates.leanMass.currentValue).toBeGreaterThan(90);
          expect(estimates.leanMass.goalValue).toBeGreaterThan(95);
        }
      });

      test('should return estimates with reasons for insufficient data', () => {
        const estimates = goalManager.estimateGoalAchievement([], mockGoals, true);
        expect(estimates).toBeDefined();
        expect(estimates.weight.success).toBe(false);
        expect(estimates.weight.reason).toBe('insufficient_data');
        expect(estimates.bodyFat.success).toBe(false);
        expect(estimates.bodyFat.reason).toBe('insufficient_data');
      });

      test('should return estimates with reasons for single measurement', () => {
        const singleMeasurement = [mockMeasurements[0]];
        const estimates = goalManager.estimateGoalAchievement(singleMeasurement, mockGoals, true);
        expect(estimates).toBeDefined();
        expect(estimates.weight.success).toBe(false);
        expect(estimates.weight.reason).toBe('insufficient_data');
      });

      test('should return null for no goals', () => {
        const estimates = goalManager.estimateGoalAchievement(mockMeasurements, {}, true);
        expect(estimates).toBeNull();
      });

      test('should handle partial goals', () => {
        const partialGoals = { weight: 70 };
        const estimates = goalManager.estimateGoalAchievement(mockMeasurements, partialGoals, true);
        
        expect(estimates).toBeDefined();
        expect(estimates.weight).toBeDefined();
        expect(estimates.bodyFat).toBeUndefined();
        expect(estimates.leanMass).toBeUndefined();
      });
    });

    describe('renderGoalTimeline', () => {
      test('should render timeline with estimate', () => {
        const mockEstimate = {
          success: true,
          daysToGoal: 45,
          targetDate: new Date('2025-08-30'),
          confidence: 'high',
          dailyRate: 0.1,
          achievable: true,
          unit: 'kg',
          formatted: { estimate: '~45 days' }
        };

        const html = goalManager.renderGoalTimeline(mockEstimate, 'high');
        
        expect(html).toContain('goal-timeline-container');
        expect(html).toContain('~45 days');
        expect(html).toContain('high confidence');
        expect(html).toContain('achievable');
        expect(html).toContain('0.10 kg/day');
        expect(html).toContain('8/30/2025');
      });

      test('should render insufficient data message', () => {
        const mockEstimate = {
          success: false,
          reason: 'insufficient_data',
          currentValue: 65,
          goalValue: 70
        };
        
        const html = goalManager.renderGoalTimeline(mockEstimate, 'low');
        
        expect(html).toContain('goal-timeline-container');
        expect(html).toContain('Need more measurement data for timeline estimation');
        expect(html).toContain('timeline-info');
      });

      test('should handle different confidence levels', () => {
        const mockEstimate = {
          success: true,
          daysToGoal: 30,
          targetDate: new Date('2025-08-15'),
          confidence: 'medium',
          dailyRate: -0.05,
          achievable: false,
          unit: '%',
          formatted: { estimate: '~30 days' }
        };

        const html = goalManager.renderGoalTimeline(mockEstimate, 'medium');
        
        expect(html).toContain('confidence-medium');
        expect(html).toContain('medium confidence');
        expect(html).toContain('challenging');
        expect(html).toContain('0.05 %/day');
      });
    });

    describe('getTimelineStatus', () => {
      test('should return achievable status for high confidence', () => {
        const mockEstimate = {
          achievable: true,
          confidence: 'high'
        };

        const status = goalManager.getTimelineStatus(mockEstimate);
        
        expect(status.status).toBe('achievable');
        expect(status.message).toBe('On track');
        expect(status.class).toBe('status-positive');
      });

      test('should return likely status for medium confidence', () => {
        const mockEstimate = {
          achievable: true,
          confidence: 'medium'
        };

        const status = goalManager.getTimelineStatus(mockEstimate);
        
        expect(status.status).toBe('likely');
        expect(status.message).toBe('Likely achievable');
        expect(status.class).toBe('status-positive');
      });

      test('should return uncertain status for low confidence', () => {
        const mockEstimate = {
          achievable: true,
          confidence: 'low'
        };

        const status = goalManager.getTimelineStatus(mockEstimate);
        
        expect(status.status).toBe('uncertain');
        expect(status.message).toBe('Progress uncertain');
        expect(status.class).toBe('status-neutral');
      });

      test('should return challenging status for unachievable goals', () => {
        const mockEstimate = {
          achievable: false,
          confidence: 'high'
        };

        const status = goalManager.getTimelineStatus(mockEstimate);
        
        expect(status.status).toBe('challenging');
        expect(status.message).toBe('Adjust strategy');
        expect(status.class).toBe('status-negative');
      });

      test('should return insufficient data status for null estimate', () => {
        const status = goalManager.getTimelineStatus(null);
        
        expect(status.status).toBe('insufficient_data');
        expect(status.message).toBe('Need more data');
        expect(status.class).toBe('status-neutral');
      });
    });

    describe('updateGoalProgressWithTimeline', () => {
      test('should update progress with timeline information', () => {
        goalManager.updateGoalProgressWithTimeline(mockMeasurements, mockGoals, true);
        
        expect(mockContainer.innerHTML).toContain('goal-progress-item');
        expect(mockContainer.innerHTML).toContain('goal-timeline-container');
        expect(mockContainer.innerHTML).toContain('Weight');
        expect(mockContainer.innerHTML).toContain('Body Fat');
        expect(mockContainer.innerHTML).toContain('Lean Mass');
      });

      test('should show empty state for no measurements', () => {
        goalManager.updateGoalProgressWithTimeline([], mockGoals, true);
        
        expect(mockContainer.innerHTML).toContain('empty-state');
        expect(mockContainer.innerHTML).toContain('Add measurements to track goal progress');
      });

      test('should handle partial goals with timeline', () => {
        const partialGoals = { weight: 70 };
        goalManager.updateGoalProgressWithTimeline(mockMeasurements, partialGoals, true);
        
        expect(mockContainer.innerHTML).toContain('goal-progress-item');
        expect(mockContainer.innerHTML).toContain('goal-timeline-container');
        expect(mockContainer.innerHTML).toContain('Weight');
        expect(mockContainer.innerHTML).not.toContain('Body Fat');
        expect(mockContainer.innerHTML).not.toContain('Lean Mass');
      });

      test('should handle imperial units with timeline', () => {
        goalManager.updateGoalProgressWithTimeline(mockMeasurements, mockGoals, false);
        
        expect(mockContainer.innerHTML).toContain('goal-progress-item');
        expect(mockContainer.innerHTML).toContain('goal-timeline-container');
        expect(mockContainer.innerHTML).toContain('lbs');
      });
    });

    describe('getGoalTimelinesSummary', () => {
      test('should return timeline summaries', () => {
        const summary = goalManager.getGoalTimelinesSummary(mockMeasurements, mockGoals, true);
        
        expect(summary.hasTimelines).toBe(true);
        expect(summary.summaries).toBeInstanceOf(Array);
        expect(summary.summaries.length).toBeGreaterThan(0);
        expect(summary.estimates).toBeDefined();
      });

      test('should return message for no data', () => {
        const summary = goalManager.getGoalTimelinesSummary([], mockGoals, true);
        
        expect(summary.hasTimelines).toBe(true);
        expect(summary.summaries).toBeInstanceOf(Array);
        expect(summary.summaries.length).toBeGreaterThan(0);
      });

      test('should include status messages in summaries', () => {
        const summary = goalManager.getGoalTimelinesSummary(mockMeasurements, mockGoals, true);
        
        if (summary.hasTimelines) {
          summary.summaries.forEach(summaryText => {
            expect(summaryText).toMatch(/Weight:|Body Fat:|Lean Mass:/);
            expect(summaryText).toMatch(/\(.*\)/);
          });
        }
      });

      test('should handle different confidence levels in summaries', () => {
        const summary = goalManager.getGoalTimelinesSummary(mockMeasurements, mockGoals, true);
        
        if (summary.hasTimelines && summary.summaries.length > 0) {
          const statusMessages = summary.summaries.map(s => s.match(/\((.*)\)/)[1]);
          statusMessages.forEach(status => {
            expect(['On track', 'Likely achievable', 'Progress uncertain', 'Adjust strategy', 'Need more data']).toContain(status);
          });
        }
      });
    });

    describe('Edge Cases and Error Handling', () => {
      test('should handle measurements with missing fields', () => {
        const incompleteData = [
          { date: '2025-07-01', weight: 65 },
          { date: '2025-07-02', weight: 65.5 }
        ];
        
        const estimates = goalManager.estimateGoalAchievement(incompleteData, mockGoals, true);
        // Should still return estimates for weight goal since it has data
        expect(estimates).toBeDefined();
        expect(estimates.weight).toBeDefined();
        // But bodyFat and leanMass should have issues due to missing fields
        if (estimates.bodyFat) {
          expect(estimates.bodyFat.currentValue).toBeUndefined();
        }
      });

      test('should handle invalid goals', () => {
        const invalidGoals = { weight: null, bodyFat: 'invalid', leanMass: -5 };
        const estimates = goalManager.estimateGoalAchievement(mockMeasurements, invalidGoals, true);
        // Should handle invalid goals gracefully
        expect(estimates).toBeDefined();
        expect(estimates.weight).toBeUndefined(); // null weight goal
        if (estimates.bodyFat) {
          expect(estimates.bodyFat.goalValue).toBe('invalid');
        }
      });

      test('should handle flat data with no trend', () => {
        const flatData = mockMeasurements.map(m => ({ ...m, weight: 65, bodyFat: 10, leanMass: 42 }));
        const estimates = goalManager.estimateGoalAchievement(flatData, mockGoals, true);
        expect(estimates).toBeDefined();
        expect(estimates.weight.success).toBe(false);
        expect(estimates.weight.reason).toBe('trend_too_weak');
      });

      test('should handle very recent measurements', () => {
        const today = new Date();
        const recentData = [
          { date: today.toISOString().split('T')[0], weight: 65, bodyFat: 10, leanMass: 42 },
          { date: new Date(today.getTime() - 86400000).toISOString().split('T')[0], weight: 65.1, bodyFat: 10.1, leanMass: 42.1 }
        ];
        
        const estimates = goalManager.estimateGoalAchievement(recentData, mockGoals, true);
        // Should return estimates for trending data, even if only 2 recent measurements
        expect(estimates).toBeDefined();
        expect(estimates.bodyFat).toBeDefined();
        expect(estimates.bodyFat.daysToGoal).toBeGreaterThan(0);
      });

      test('should handle goals equal to current values', () => {
        const currentGoals = {
          weight: mockMeasurements[0].weight,
          bodyFat: mockMeasurements[0].bodyFat,
          leanMass: mockMeasurements[0].leanMass
        };
        
        const estimates = goalManager.estimateGoalAchievement(mockMeasurements, currentGoals, true);
        expect(estimates).toBeDefined();
        expect(estimates.weight.success).toBe(false);
        expect(estimates.weight.reason).toBe('goal_achieved');
      });
    });
  });
});