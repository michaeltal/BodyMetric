const CalculationService = require('../../js/services/CalculationService');

describe('CalculationService', () => {
  let calcService;

  beforeEach(() => {
    calcService = new CalculationService();
  });

  describe('constructor', () => {
    test('should initialize with correct conversion constants', () => {
      expect(calcService.KG_TO_LBS).toBeCloseTo(2.20462);
      expect(calcService.CM_TO_INCHES).toBeCloseTo(0.393701);
    });
  });

  describe('calculateBMI', () => {
    test('should calculate BMI correctly', () => {
      const bmi = calcService.calculateBMI(70, 175);
      expect(bmi).toBeCloseTo(22.86, 2);
    });

    test('should return null for invalid height', () => {
      expect(calcService.calculateBMI(70, 0)).toBeNull();
      expect(calcService.calculateBMI(70, null)).toBeNull();
      expect(calcService.calculateBMI(70, undefined)).toBeNull();
    });

    test('should handle edge cases', () => {
      expect(calcService.calculateBMI(50, 150)).toBeCloseTo(22.22, 2);
      expect(calcService.calculateBMI(100, 200)).toBeCloseTo(25, 2);
    });
  });

  describe('getBMICategory', () => {
    test('should return correct categories', () => {
      expect(calcService.getBMICategory(17)).toBe('Underweight');
      expect(calcService.getBMICategory(18.5)).toBe('Normal');
      expect(calcService.getBMICategory(22)).toBe('Normal');
      expect(calcService.getBMICategory(24.9)).toBe('Normal');
      expect(calcService.getBMICategory(25)).toBe('Overweight');
      expect(calcService.getBMICategory(29.9)).toBe('Overweight');
      expect(calcService.getBMICategory(30)).toBe('Obese');
      expect(calcService.getBMICategory(35)).toBe('Obese');
    });

    test('should handle invalid BMI values', () => {
      expect(calcService.getBMICategory(null)).toBe('--');
      expect(calcService.getBMICategory(undefined)).toBe('--');
      expect(calcService.getBMICategory(0)).toBe('--');
    });
  });

  describe('calculateMovingAverage', () => {
    test('should calculate moving average correctly', () => {
      const data = [1, 2, 3, 4, 5];
      const result = calcService.calculateMovingAverage(data, 3);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toBeCloseTo(1.5, 1); // (1+2)/2
      expect(result[2]).toBeCloseTo(3, 1);   // (2+3+4)/3
    });

    test('should handle empty array', () => {
      const result = calcService.calculateMovingAverage([], 3);
      expect(result).toEqual([]);
    });

    test('should handle single element', () => {
      const result = calcService.calculateMovingAverage([5], 3);
      expect(result).toEqual([5]);
    });

    test('should handle window size larger than data', () => {
      const data = [1, 2, 3];
      const result = calcService.calculateMovingAverage(data, 10);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toBeCloseTo(2, 1); // average of all elements
      expect(result[1]).toBeCloseTo(2, 1);
      expect(result[2]).toBeCloseTo(2, 1);
    });
  });

  describe('getAverage', () => {
    const measurements = [
      { weight: 70, bodyFat: 15 },
      { weight: 71, bodyFat: 16 },
      { weight: 72, bodyFat: 17 },
      { weight: 73, bodyFat: 18 }
    ];

    test('should calculate average for field correctly', () => {
      const avgWeight = calcService.getAverage(measurements, 'weight');
      expect(avgWeight).toBeCloseTo(71.5, 1);

      const avgBodyFat = calcService.getAverage(measurements, 'bodyFat');
      expect(avgBodyFat).toBeCloseTo(16.5, 1);
    });

    test('should handle slice parameters', () => {
      const avgWeight = calcService.getAverage(measurements, 'weight', 1, 3);
      expect(avgWeight).toBeCloseTo(71.5, 1); // (71+72)/2
    });

    test('should return null for empty slice', () => {
      expect(calcService.getAverage([], 'weight')).toBeNull();
      expect(calcService.getAverage(measurements, 'weight', 5, 10)).toBeNull();
    });
  });

  describe('calculateTrend', () => {
    test('should calculate positive trend', () => {
      const trend = calcService.calculateTrend(75, 70);
      
      expect(trend.diff).toBe(5);
      expect(trend.percentage).toBeCloseTo(7.1, 1);
      expect(trend.trendClass).toBe('trend-up');
      expect(trend.arrow).toBe('⬆️');
      expect(trend.sign).toBe('+');
    });

    test('should calculate negative trend', () => {
      const trend = calcService.calculateTrend(65, 70);
      
      expect(trend.diff).toBe(-5);
      expect(trend.percentage).toBeCloseTo(-7.1, 1);
      expect(trend.trendClass).toBe('trend-down');
      expect(trend.arrow).toBe('⬇️');
      expect(trend.sign).toBe('');
    });

    test('should calculate neutral trend for small changes', () => {
      const trend = calcService.calculateTrend(70.05, 70);
      
      expect(trend.trendClass).toBe('trend-neutral');
      expect(trend.arrow).toBe('➡️');
      expect(trend.sign).toBe('');
    });

    test('should return null for invalid previous value', () => {
      expect(calcService.calculateTrend(70, null)).toBeNull();
      expect(calcService.calculateTrend(70, undefined)).toBeNull();
    });
  });

  describe('unit conversions', () => {
    test('should convert weight correctly', () => {
      expect(calcService.convertWeight(70, true)).toBe(70);
      expect(calcService.convertWeight(70, false)).toBeCloseTo(154.32, 2);
    });

    test('should convert lean mass correctly', () => {
      expect(calcService.convertLeanMass(50, true)).toBe(50);
      expect(calcService.convertLeanMass(50, false)).toBeCloseTo(110.23, 2);
    });

    test('should convert height correctly', () => {
      expect(calcService.convertHeight(175, true)).toBe(175);
      expect(calcService.convertHeight(175, false)).toBeCloseTo(68.9, 1);
    });
  });

  describe('formatting methods', () => {
    test('should format weight correctly', () => {
      expect(calcService.formatWeight(70.123, true)).toBe('70.1');
      expect(calcService.formatWeight(70.123, false)).toBe('154.6');
    });

    test('should format lean mass correctly', () => {
      expect(calcService.formatLeanMass(50.567, true)).toBe('50.6');
      expect(calcService.formatLeanMass(50.567, false)).toBe('111.5');
    });

    test('should format height correctly', () => {
      expect(calcService.formatHeight(175.7, true)).toBe('176');
      expect(calcService.formatHeight(175.7, false)).toBe('69.2');
    });
  });

  describe('calculateGoalProgress', () => {
    const measurements = [
      { weight: 65, bodyFat: 12, leanMass: 48 },
      { weight: 68, bodyFat: 14, leanMass: 46 },
      { weight: 70, bodyFat: 16, leanMass: 44 }
    ];

    test('should calculate weight goal progress', () => {
      const progress = calcService.calculateGoalProgress(68, 65, false, measurements);
      expect(progress).toBeCloseTo(40, 0); // 2/5 progress from 70 to 65
    });

    test('should calculate body fat goal progress', () => {
      const progress = calcService.calculateGoalProgress(14, 10, true, measurements);
      expect(progress).toBeCloseTo(33.3, 1); // 2/6 reduction from 16 to 10
    });

    test('should handle completed goals', () => {
      const progress = calcService.calculateGoalProgress(60, 65, false, measurements);
      expect(progress).toBe(100); // Goal exceeded, capped at 100
    });

    test('should handle no initial data', () => {
      const progress = calcService.calculateGoalProgress(70, 65, false, []);
      expect(progress).toBe(0);
    });
  });

  describe('getChangeClass', () => {
    test('should return correct classes for regular metrics', () => {
      expect(calcService.getChangeClass(5)).toBe('positive');
      expect(calcService.getChangeClass(-5)).toBe('negative');
      expect(calcService.getChangeClass(0.05)).toBe('neutral');
    });

    test('should return correct classes for body fat (inverted)', () => {
      expect(calcService.getChangeClass(2, true)).toBe('negative');
      expect(calcService.getChangeClass(-2, true)).toBe('positive');
      expect(calcService.getChangeClass(0.05, true)).toBe('neutral');
    });
  });

  describe('calculatePeriodInsights', () => {
    const measurements = [
      { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 50 },
      { date: '2025-01-05', weight: 71, bodyFat: 16, leanMass: 49 },
      { date: '2025-01-01', weight: 72, bodyFat: 17, leanMass: 48 }
    ];

    test('should calculate period insights correctly', () => {
      const startDate = new Date('2025-01-01');
      const insights = calcService.calculatePeriodInsights(measurements, startDate);
      
      expect(insights.weightChange).toBe(-2);
      expect(insights.bodyFatChange).toBe(-2);
      expect(insights.leanMassChange).toBe(2);
      expect(insights.period).toBe(3);
    });

    test('should return null for insufficient data', () => {
      const startDate = new Date('2025-01-01');
      expect(calcService.calculatePeriodInsights([], startDate)).toBeNull();
      expect(calcService.calculatePeriodInsights([measurements[0]], startDate)).toBeNull();
    });

    test('should filter by date correctly', () => {
      const startDate = new Date('2025-01-06');
      const insights = calcService.calculatePeriodInsights(measurements, startDate);
      
      expect(insights).toBeNull(); // Should return null for < 2 measurements after filter
    });
  });

  describe('validateMeasurement', () => {
    test('should validate correct measurement', () => {
      const measurement = {
        date: '2025-01-01',
        weight: 70,
        bodyFat: 15,
        leanMass: 50
      };
      
      const result = calcService.validateMeasurement(measurement);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing fields', () => {
      const measurement = {
        weight: 70,
        bodyFat: 15
      };
      
      const result = calcService.validateMeasurement(measurement);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Date is required');
      expect(result.errors).toContain('Lean mass must be a positive number');
    });

    test('should detect invalid values', () => {
      const measurement = {
        date: '2025-01-01',
        weight: -5,
        bodyFat: 150,
        leanMass: 0
      };
      
      const result = calcService.validateMeasurement(measurement);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight must be a positive number');
      expect(result.errors).toContain('Body fat must be between 0 and 100');
      expect(result.errors).toContain('Lean mass must be a positive number');
    });
  });

  describe('normalization methods', () => {
    test('should normalize weight correctly', () => {
      expect(calcService.normalizeWeight(70, true)).toBe(70);
      expect(calcService.normalizeWeight(154.32, false)).toBeCloseTo(70, 1);
    });

    test('should normalize lean mass correctly', () => {
      expect(calcService.normalizeLeanMass(50, true)).toBe(50);
      expect(calcService.normalizeLeanMass(110.23, false)).toBeCloseTo(50, 1);
    });

    test('should normalize height correctly', () => {
      expect(calcService.normalizeHeight(175, true)).toBe(175);
      expect(calcService.normalizeHeight(69, false)).toBeCloseTo(175.26, 1);
    });
  });

  describe('Timeline Estimation Functions', () => {
    let mockMeasurements;

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
    });

    describe('calculateLinearRegression', () => {
      test('should calculate linear regression with weighted data', () => {
        const result = calcService.calculateLinearRegression(mockMeasurements, 'weight', 14);
        
        expect(result).toBeDefined();
        expect(result.slope).toBeGreaterThan(0);
        expect(result.intercept).toBeDefined();
        expect(result.rSquared).toBeGreaterThan(0);
        expect(result.dataPoints).toBeGreaterThan(0);
        expect(result.timeframeDays).toBe(14);
      });

      test('should return null for insufficient data', () => {
        const result = calcService.calculateLinearRegression([], 'weight', 14);
        expect(result).toBeNull();
      });

      test('should return null for single measurement', () => {
        const singleMeasurement = [mockMeasurements[0]];
        const result = calcService.calculateLinearRegression(singleMeasurement, 'weight', 14);
        expect(result).toBeNull();
      });

      test('should handle different fields correctly', () => {
        const weightResult = calcService.calculateLinearRegression(mockMeasurements, 'weight', 14);
        const bodyFatResult = calcService.calculateLinearRegression(mockMeasurements, 'bodyFat', 14);
        const leanMassResult = calcService.calculateLinearRegression(mockMeasurements, 'leanMass', 14);

        expect(weightResult.slope).toBeGreaterThan(0);
        expect(bodyFatResult.slope).toBeLessThan(0);
        expect(leanMassResult.slope).toBeGreaterThan(0);
      });

      test('should handle different timeframes', () => {
        const shortTerm = calcService.calculateLinearRegression(mockMeasurements, 'weight', 7);
        const longTerm = calcService.calculateLinearRegression(mockMeasurements, 'weight', 30);

        expect(shortTerm.timeframeDays).toBe(7);
        expect(longTerm.timeframeDays).toBe(30);
        expect(shortTerm.dataPoints).toBeLessThanOrEqual(longTerm.dataPoints);
      });
    });

    describe('calculateTrendSlope', () => {
      test('should return slope from linear regression', () => {
        const slope = calcService.calculateTrendSlope(mockMeasurements, 'weight', 14);
        expect(slope).toBeGreaterThan(0);
        expect(typeof slope).toBe('number');
      });

      test('should return null for insufficient data', () => {
        const slope = calcService.calculateTrendSlope([], 'weight', 14);
        expect(slope).toBeNull();
      });

      test('should handle negative slopes', () => {
        const slope = calcService.calculateTrendSlope(mockMeasurements, 'bodyFat', 14);
        expect(slope).toBeLessThan(0);
      });
    });

    describe('estimateGoalTimeline', () => {
      test('should estimate timeline for weight gain goal', () => {
        const currentWeight = 65;
        const goalWeight = 70;
        const timeline = calcService.estimateGoalTimeline(mockMeasurements, 'weight', currentWeight, goalWeight, 14);

        expect(timeline).toBeDefined();
        expect(timeline.daysToGoal).toBeGreaterThan(0);
        expect(timeline.daysToGoal).toBeLessThan(1000);
        expect(timeline.targetDate).toBeInstanceOf(Date);
        expect(timeline.confidence).toMatch(/^(high|medium|low)$/);
        expect(timeline.rSquared).toBeGreaterThanOrEqual(0);
        expect(timeline.rSquared).toBeLessThanOrEqual(1);
        expect(timeline.dailyRate).toBeGreaterThan(0);
        expect(timeline.achievable).toBe(true);
      });

      test('should estimate timeline for body fat reduction goal', () => {
        const currentBodyFat = 10;
        const goalBodyFat = 8;
        const timeline = calcService.estimateGoalTimeline(mockMeasurements, 'bodyFat', currentBodyFat, goalBodyFat, 14);

        expect(timeline).toBeDefined();
        expect(timeline.daysToGoal).toBeGreaterThan(0);
        expect(timeline.dailyRate).toBeLessThan(0);
        expect(timeline.achievable).toBe(true);
      });

      test('should return reason object for insufficient data', () => {
        const timeline = calcService.estimateGoalTimeline([], 'weight', 65, 70, 14);
        expect(timeline).toEqual({
          success: false,
          reason: 'insufficient_data',
          currentValue: 65,
          goalValue: 70
        });
      });

      test('should return reason object when goal equals current value', () => {
        const timeline = calcService.estimateGoalTimeline(mockMeasurements, 'weight', 65, 65, 14);
        expect(timeline).toEqual({
          success: false,
          reason: 'goal_achieved',
          currentValue: 65,
          goalValue: 65
        });
      });

      test('should return reason object for very slow progress', () => {
        const flatData = mockMeasurements.map(m => ({ ...m, weight: 65 }));
        const timeline = calcService.estimateGoalTimeline(flatData, 'weight', 65, 70, 14);
        expect(timeline).toEqual({
          success: false,
          reason: 'trend_too_weak',
          currentValue: 65,
          goalValue: 70
        });
      });

      test('should return reason object for unrealistic timelines', () => {
        // Create data with decreasing weight but goal is to increase weight
        const decreasingData = mockMeasurements.map((m, i) => ({ 
          ...m, 
          weight: 70 - (i * 0.2),  // Start high, decrease over time
          date: new Date(Date.now() - (mockMeasurements.length - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }));
        const timeline = calcService.estimateGoalTimeline(decreasingData, 'weight', 60, 70, 14);
        expect(timeline).toEqual({
          success: false,
          reason: 'invalid_timeline',
          currentValue: 60,
          goalValue: 70
        });
      });
    });

    describe('calculatePredictionConfidence', () => {
      test('should return R-squared value', () => {
        const confidence = calcService.calculatePredictionConfidence(mockMeasurements, 'weight', 14);
        expect(confidence).toBeGreaterThanOrEqual(0);
        expect(confidence).toBeLessThanOrEqual(1);
      });

      test('should return 0 for insufficient data', () => {
        const confidence = calcService.calculatePredictionConfidence([], 'weight', 14);
        expect(confidence).toBe(0);
      });

      test('should return high confidence for consistent data', () => {
        const confidence = calcService.calculatePredictionConfidence(mockMeasurements, 'weight', 14);
        expect(confidence).toBeGreaterThan(0.5);
      });
    });

    describe('getWeightedAverage', () => {
      test('should calculate weighted average with exponential decay', () => {
        const average = calcService.getWeightedAverage(mockMeasurements, 'weight', 14);
        expect(average).toBeGreaterThan(65);
        expect(average).toBeLessThan(68);
      });

      test('should return null for empty data', () => {
        const average = calcService.getWeightedAverage([], 'weight', 14);
        expect(average).toBeNull();
      });

      test('should handle different timeframes', () => {
        const shortTerm = calcService.getWeightedAverage(mockMeasurements, 'weight', 7);
        const longTerm = calcService.getWeightedAverage(mockMeasurements, 'weight', 30);
        
        expect(shortTerm).toBeDefined();
        expect(longTerm).toBeDefined();
        expect(shortTerm).toBeGreaterThan(longTerm);
      });

      test('should handle different fields', () => {
        const weightAvg = calcService.getWeightedAverage(mockMeasurements, 'weight', 14);
        const bodyFatAvg = calcService.getWeightedAverage(mockMeasurements, 'bodyFat', 14);
        const leanMassAvg = calcService.getWeightedAverage(mockMeasurements, 'leanMass', 14);

        expect(weightAvg).toBeGreaterThan(65);
        expect(bodyFatAvg).toBeLessThan(10);
        expect(leanMassAvg).toBeGreaterThan(42);
      });
    });

    describe('getConfidenceLevel', () => {
      test('should return correct confidence levels', () => {
        expect(calcService.getConfidenceLevel(0.8)).toBe('high');
        expect(calcService.getConfidenceLevel(0.7)).toBe('high');
        expect(calcService.getConfidenceLevel(0.6)).toBe('medium');
        expect(calcService.getConfidenceLevel(0.4)).toBe('medium');
        expect(calcService.getConfidenceLevel(0.3)).toBe('low');
        expect(calcService.getConfidenceLevel(0.0)).toBe('low');
      });

      test('should handle edge cases', () => {
        expect(calcService.getConfidenceLevel(1.0)).toBe('high');
        expect(calcService.getConfidenceLevel(0.69)).toBe('medium');
        expect(calcService.getConfidenceLevel(0.39)).toBe('low');
      });
    });

    describe('isGoalAchievable', () => {
      test('should return true for same direction progress', () => {
        expect(calcService.isGoalAchievable(0.1, 5)).toBe(true);
        expect(calcService.isGoalAchievable(-0.1, -5)).toBe(true);
      });

      test('should return false for opposite direction progress', () => {
        expect(calcService.isGoalAchievable(0.1, -5)).toBe(false);
        expect(calcService.isGoalAchievable(-0.1, 5)).toBe(false);
      });

      test('should return false for very slow progress', () => {
        expect(calcService.isGoalAchievable(0.005, 5)).toBe(false);
        expect(calcService.isGoalAchievable(-0.005, -5)).toBe(false);
      });

      test('should handle edge cases', () => {
        expect(calcService.isGoalAchievable(0.011, 1)).toBe(true);
        expect(calcService.isGoalAchievable(-0.011, -1)).toBe(true);
        expect(calcService.isGoalAchievable(0, 5)).toBe(false);
      });
    });

    describe('formatTimelineEstimate', () => {
      test('should format short timelines in days', () => {
        const result = calcService.formatTimelineEstimate(1, 'high');
        expect(result.estimate).toBe('~1 day');
        expect(result.exact).toBe('1 day');
        expect(result.confidence).toBe('high');

        const result2 = calcService.formatTimelineEstimate(15, 'medium');
        expect(result2.estimate).toBe('~15 days');
        expect(result2.exact).toBe('15 days');
      });

      test('should format medium timelines in weeks', () => {
        const result = calcService.formatTimelineEstimate(35, 'high');
        expect(result.estimate).toBe('~5 weeks');
        expect(result.confidence).toBe('high');

        const result2 = calcService.formatTimelineEstimate(49, 'medium');
        expect(result2.estimate).toBe('~7 weeks');
      });

      test('should format long timelines in months', () => {
        const result = calcService.formatTimelineEstimate(120, 'low');
        expect(result.estimate).toBe('~4 months');
        expect(result.confidence).toBe('low');

        const result2 = calcService.formatTimelineEstimate(180, 'medium');
        expect(result2.estimate).toBe('~6 months');
      });

      test('should return null for invalid input', () => {
        expect(calcService.formatTimelineEstimate(0, 'high')).toBeNull();
        expect(calcService.formatTimelineEstimate(-5, 'high')).toBeNull();
        expect(calcService.formatTimelineEstimate(null, 'high')).toBeNull();
      });

      test('should handle edge cases', () => {
        const result30 = calcService.formatTimelineEstimate(30, 'high');
        expect(result30.estimate).toBe('~30 days');

        const result31 = calcService.formatTimelineEstimate(31, 'high');
        expect(result31.estimate).toBe('~4 weeks');

        const result90 = calcService.formatTimelineEstimate(90, 'high');
        expect(result90.estimate).toBe('~13 weeks');

        const result91 = calcService.formatTimelineEstimate(91, 'high');
        expect(result91.estimate).toBe('~3 months');
      });
    });

    describe('Edge Cases and Error Handling', () => {
      test('should handle measurements with missing fields', () => {
        const incompleteData = [
          { date: '2025-07-01', weight: 65 },
          { date: '2025-07-02', weight: 65.5 }
        ];
        
        const result = calcService.calculateLinearRegression(incompleteData, 'bodyFat', 14);
        expect(result).toBeNull();
      });

      test('should handle invalid dates', () => {
        const invalidData = [
          { date: 'invalid-date', weight: 65, bodyFat: 10, leanMass: 42 },
          { date: '2025-07-02', weight: 65.5, bodyFat: 10.1, leanMass: 42.1 }
        ];
        
        const result = calcService.calculateLinearRegression(invalidData, 'weight', 14);
        expect(result).toBeNull();
      });

      test('should handle extreme values', () => {
        const extremeData = mockMeasurements.map(m => ({ ...m, weight: 1000 }));
        const result = calcService.calculateLinearRegression(extremeData, 'weight', 14);
        
        expect(result).toBeDefined();
        expect(Math.abs(result.slope)).toBeLessThan(0.001);
      });

      test('should handle very recent measurements only', () => {
        const today = new Date();
        const recentData = [
          { date: today.toISOString().split('T')[0], weight: 65, bodyFat: 10, leanMass: 42 },
          { date: new Date(today.getTime() - 86400000).toISOString().split('T')[0], weight: 65.1, bodyFat: 10.1, leanMass: 42.1 }
        ];
        
        const result = calcService.calculateLinearRegression(recentData, 'weight', 14);
        expect(result).toBeDefined();
        expect(result.dataPoints).toBe(2);
      });
    });
  });
});