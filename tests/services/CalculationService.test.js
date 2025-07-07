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
});